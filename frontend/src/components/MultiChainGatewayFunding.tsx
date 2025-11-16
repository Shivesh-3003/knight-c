/**
 * MultiChainGatewayFunding Component
 *
 * Two-step UI for Circle Gateway treasury funding:
 * 1. Deposit to Gateway (one-time per chain, creates unified balance)
 * 2. Transfer from unified balance to Arc treasury (instant)
 */

import { useState, useEffect } from "react";
import {
  useAccount,
  useWalletClient,
  usePublicClient,
  useSwitchChain,
} from "wagmi";
import {
  parseUnits,
  formatUnits,
  type Address,
  createPublicClient,
  http,
} from "viem";
import {
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  polygonAmoy,
  avalancheFuji,
} from "viem/chains";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getGatewayBalance, transferToTreasury } from "@/lib/api";

// Chain configurations
const CHAINS = {
  sepolia: {
    chain: sepolia,
    name: "Ethereum Sepolia",
    domainId: 0,
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address,
  },
  base: {
    chain: baseSepolia,
    name: "Base Sepolia",
    domainId: 6,
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address,
  },
  arbitrum: {
    chain: arbitrumSepolia,
    name: "Arbitrum Sepolia",
    domainId: 3,
    usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as Address,
  },
  polygon: {
    chain: polygonAmoy,
    name: "Polygon Amoy",
    domainId: 7,
    usdcAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582" as Address,
  },
  avalanche: {
    chain: avalancheFuji,
    name: "Avalanche Fuji",
    domainId: 1,
    usdcAddress: "0x5425890298aed601595a70ab815c96711a31bc65" as Address,
  },
};

const GATEWAY_WALLET = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9" as Address;

type ChainKey = keyof typeof CHAINS;
type DepositStatus =
  | "not_started"
  | "depositing"
  | "waiting_finality"
  | "ready"
  | "error";

interface ChainStatus {
  status: DepositStatus;
  depositTxHash?: string;
  depositBlock?: number;
  currentBlock?: number;
}

export function MultiChainGatewayFunding() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();

  // Step 1: Deposit to Gateway
  const [selectedChain, setSelectedChain] = useState<ChainKey>("base");
  const [depositAmount, setDepositAmount] = useState("5");
  const [chainStatuses, setChainStatuses] = useState<
    Record<ChainKey, ChainStatus>
  >({
    sepolia: { status: "not_started" },
    base: { status: "not_started" },
    arbitrum: { status: "not_started" },
    polygon: { status: "not_started" },
    avalanche: { status: "not_started" },
  });
  const [isDepositing, setIsDepositing] = useState(false);

  // Step 2: Transfer from unified balance
  const [unifiedBalance, setUnifiedBalance] = useState("0");
  const [transferAmount, setTransferAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Load chain statuses from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("gateway-chain-statuses");
    if (saved) {
      setChainStatuses(JSON.parse(saved));
    }
  }, []);

  // Fetch unified balance
  useEffect(() => {
    if (address) {
      fetchUnifiedBalance();
    }
  }, [address]);

  const fetchUnifiedBalance = async () => {
    if (!address) return;

    try {
      const response = await getGatewayBalance(address);
      if (response.success && response.data) {
        setUnifiedBalance(response.data.balance);
      } else {
        console.error(
          "Failed to fetch unified balance:",
          (response as any).error
        );
        setUnifiedBalance("0");
      }
    } catch (error) {
      console.error("Failed to fetch unified balance:", error);
      setUnifiedBalance("0");
    }
  };

  // Monitor pending deposits for finality
  useEffect(() => {
    const pendingDeposits = Object.entries(chainStatuses).filter(
      ([_, status]) => status.status === "waiting_finality"
    );

    if (pendingDeposits.length === 0) return;

    const interval = setInterval(async () => {
      for (const [chainKey, status] of pendingDeposits) {
        if (!status.depositBlock) continue;

        const chain = CHAINS[chainKey as ChainKey].chain;
        const client = createPublicClient({
          chain,
          transport: http(),
        });
        const currentBlock = await client.getBlockNumber();
        const confirmations = Number(currentBlock) - status.depositBlock;

        if (confirmations >= 32) {
          // Finality reached!
          console.log(`\n✅ Finality Reached for ${CHAINS[chainKey as ChainKey].name}!`);
          console.log(`  Total confirmations: ${confirmations}/32`);
          console.log(`  Unified balance will be updated shortly...`);

          setChainStatuses((prev) => ({
            ...prev,
            [chainKey]: { ...status, status: "ready" },
          }));

          toast({
            title: "✅ Deposit Finalized!",
            description: `${
              CHAINS[chainKey as ChainKey].name
            } deposit is ready. You can now transfer instantly to Arc!`,
          });

          fetchUnifiedBalance();
        } else {
          // Update progress
          console.log(`  ⏳ Progress: ${confirmations}/32 confirmations for ${CHAINS[chainKey as ChainKey].name}`);

          setChainStatuses((prev) => ({
            ...prev,
            [chainKey]: { ...status, currentBlock: Number(currentBlock) },
          }));
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [chainStatuses]);

  // Save statuses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      "gateway-chain-statuses",
      JSON.stringify(chainStatuses)
    );
  }, [chainStatuses]);

  const handleDepositToGateway = async () => {
    if (!walletClient || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    const chainConfig = CHAINS[selectedChain];

    // Switch to the selected chain
    try {
      await switchChain({ chainId: chainConfig.chain.id });
    } catch (error) {
      toast({
        title: "Failed to switch chain",
        description: `Please switch to ${chainConfig.name} manually`,
        variant: "destructive",
      });
      return;
    }

    setIsDepositing(true);
    setChainStatuses((prev) => ({
      ...prev,
      [selectedChain]: { status: "depositing" },
    }));

    console.log('\n🔷 Starting Gateway Deposit Flow');
    console.log(`  Chain: ${chainConfig.name}`);
    console.log(`  Amount: ${depositAmount} USDC`);
    console.log(`  Wallet: ${address}`);

    try {
      const amount = parseUnits(depositAmount, 6);

      // Create a fresh publicClient for this specific chain
      const chainClient = createPublicClient({
        chain: chainConfig.chain,
        transport: http(),
      });

      // Step 1: Approve Gateway Wallet
      console.log('\n📝 Step 1: Approving Gateway Wallet...');
      toast({
        title: "Approval Required",
        description: "Please approve the Gateway Wallet to spend your USDC",
      });

      const approveTx = await walletClient.writeContract({
        address: chainConfig.usdcAddress,
        abi: [
          {
            name: "approve",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ type: "bool" }],
          },
        ],
        functionName: "approve",
        args: [GATEWAY_WALLET, amount],
        chain: undefined,
        account: address,
        gas: 100000n, // Set explicit gas limit for approval
      });

      console.log(`  ✓ Approval transaction submitted: ${approveTx}`);
      console.log(`  ⏳ Waiting for approval confirmation...`);

      await chainClient.waitForTransactionReceipt({ hash: approveTx });
      console.log(`  ✓ Approval confirmed!`);
      console.log(`  Explorer: ${chainConfig.chain.blockExplorers?.default.url}/tx/${approveTx}`);

      // Step 2: Deposit to Gateway Wallet
      console.log('\n💰 Step 2: Depositing to Gateway Wallet...');
      toast({
        title: "Depositing to Gateway",
        description: "Please confirm the deposit transaction",
      });

      const depositTx = await walletClient.writeContract({
        address: GATEWAY_WALLET,
        abi: [
          {
            name: "deposit",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "token", type: "address" },
              { name: "value", type: "uint256" },
            ],
            outputs: [],
          },
        ],
        functionName: "deposit",
        args: [chainConfig.usdcAddress, amount],
        chain: undefined,
        account: address,
        gas: 500000n, // Set explicit gas limit to avoid chain cap issues
      });

      console.log(`  ✓ Deposit transaction submitted: ${depositTx}`);
      console.log(`  ⏳ Waiting for deposit confirmation...`);

      const receipt = await chainClient.waitForTransactionReceipt({
        hash: depositTx,
      });

      const depositBlock = Number(receipt.blockNumber);
      console.log(`  ✓ Deposit confirmed at block ${depositBlock}!`);
      console.log(`  Explorer: ${chainConfig.chain.blockExplorers?.default.url}/tx/${depositTx}`);

      // Update status to waiting for finality
      console.log('\n⏱️  Step 3: Waiting for Finality...');
      console.log(`  ${chainConfig.name} requires ~32 block confirmations (~12-15 minutes)`);
      console.log(`  Deposit block: ${depositBlock}`);
      console.log(`  This is front-loaded - future transfers will be instant!`);

      setChainStatuses((prev) => ({
        ...prev,
        [selectedChain]: {
          status: "waiting_finality",
          depositTxHash: depositTx,
          depositBlock: depositBlock,
        },
      }));

      toast({
        title: "✅ Deposit Successful!",
        description: `Waiting for finality (~12-15 min). You can close this page and come back later.`,
      });
    } catch (error: any) {
      console.error("Deposit failed:", error);
      setChainStatuses((prev) => ({
        ...prev,
        [selectedChain]: { status: "error" },
      }));
      toast({
        title: "Deposit Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleTransferToTreasury = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // This calls the backend API which handles:
    // 1. Creating burn intent
    // 2. Signing with EIP-712
    // 3. Submitting to Gateway API
    // 4. Minting on Arc
    // 5. Depositing to treasury

    setIsTransferring(true);
    try {
      const response = await transferToTreasury(transferAmount, address);

      if (response.success) {
        toast({
          title: "✅ Treasury Funded!",
          description: `${transferAmount} USDC transferred to treasury on Arc`,
        });
        fetchUnifiedBalance();
        setTransferAmount("");
      } else {
        throw new Error((response as any).error || "Transfer failed");
      }
    } catch (error: any) {
      toast({
        title: "Transfer Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const getStatusIcon = (status: DepositStatus) => {
    switch (status) {
      case "ready":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "waiting_finality":
      case "depositing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-300" />;
    }
  };

  const getStatusText = (status: DepositStatus, chainStatus?: ChainStatus) => {
    switch (status) {
      case "ready":
        return "Ready";
      case "waiting_finality":
        if (chainStatus?.depositBlock && chainStatus?.currentBlock) {
          const confirmations =
            chainStatus.currentBlock - chainStatus.depositBlock;
          return `${confirmations}/32 confirmations`;
        }
        return "Waiting for finality";
      case "depositing":
        return "Depositing...";
      case "error":
        return "Error";
      default:
        return "Not funded";
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Build Unified Balance */}
      <Card>
        <CardHeader>
          <CardTitle>
            Step 1: Build Unified Balance (One-time per chain)
          </CardTitle>
          <CardDescription>
            Deposit USDC from any chain to create a unified balance. This is a
            one-time setup per chain. After finality (~12-15 min), all future
            transfers will be instant!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chain Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(CHAINS) as ChainKey[]).map((key) => {
              const chainStatus = chainStatuses[key];
              return (
                <div
                  key={key}
                  className={`p-3 border rounded-lg ${
                    selectedChain === key
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(chainStatus.status)}
                    <span className="text-sm font-medium">
                      {CHAINS[key].name.split(" ")[0]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {getStatusText(chainStatus.status, chainStatus)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Deposit Form */}
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chain">Select Chain</Label>
                <Select
                  value={selectedChain}
                  onValueChange={(value) => setSelectedChain(value as ChainKey)}
                >
                  <SelectTrigger id="chain">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CHAINS) as ChainKey[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {CHAINS[key].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USDC)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="5"
                  min="0"
                  step="0.000001"
                />
              </div>
            </div>

            <Alert>
              <AlertDescription>
                💡 You need at least{" "}
                <strong>{depositAmount} USDC + 2.01 USDC</strong> for the
                transfer fee. Get testnet USDC from{" "}
                <a
                  href="https://faucet.circle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Circle's faucet
                </a>
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleDepositToGateway}
              disabled={isDepositing || !address || !depositAmount}
              className="w-full"
            >
              {isDepositing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Depositing to Gateway...
                </>
              ) : (
                "Deposit to Gateway"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Transfer from Unified Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Step 2: Fund Treasury <ArrowRight className="h-5 w-5" /> Instant
            Transfer
          </CardTitle>
          <CardDescription>
            Transfer from your unified balance to Arc treasury. This is instant
            (under 500ms) once your deposits are finalized!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">
              Unified Balance (available across all chains)
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {unifiedBalance} USDC
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transferAmount">
              Amount to Transfer to Treasury
            </Label>
            <Input
              id="transferAmount"
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0"
              min="0"
              max={unifiedBalance}
              step="0.000001"
            />
            <p className="text-xs text-gray-500">
              Maximum: {unifiedBalance} USDC
            </p>
          </div>

          <Button
            onClick={handleTransferToTreasury}
            disabled={
              isTransferring ||
              !address ||
              !transferAmount ||
              Number(transferAmount) > Number(unifiedBalance)
            }
            className="w-full"
          >
            {isTransferring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transferring to Arc...
              </>
            ) : (
              "Transfer to Arc Treasury (Instant!)"
            )}
          </Button>

          {Number(unifiedBalance) === 0 && (
            <Alert>
              <AlertDescription>
                ⚠️ No unified balance available. Complete Step 1 first and wait
                for finality.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
