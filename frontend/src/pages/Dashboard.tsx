import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpRight, DollarSign, Loader2, Lock, Plus, RefreshCw, ExternalLink, Users, Edit } from "lucide-react";
import { useReadContracts, useAccount } from "wagmi";
import { SinglePaymentModal } from "@/components/SinglePaymentModal";
import { BatchPaymentModal } from "@/components/BatchPaymentModal";
import { TreasuryFunding } from "@/components/TreasuryFunding";
import { CreatePotModal } from "@/components/CreatePotModal";
import { BankAccountBalance } from "@/components/BankAccountBalance";
import { MultiChainBalances } from "@/components/MultiChainBalances";
import { BeneficiaryManagement } from "@/components/BeneficiaryManagement";
import { EditPotModal } from "@/components/EditPotModal";
import { treasuryContract } from "@/lib/wagmi";
import { POT_IDS, POT_NAMES, POT_COLORS, type PotId } from "@/lib/constants";
import { stringToBytes32, formatUSDC, formatNumber, getExplorerAddressUrl } from "@/lib/utils";
import { treasuryVaultAddress } from "@/lib/contract";
import { useUserRole } from "@/hooks/useUserRole";
import { useTreasuryBalance } from "@/hooks/useTreasuryBalance";

interface Pot {
  id: PotId;
  name: string;
  budget: bigint;
  spent: bigint;
  threshold: bigint;
  color: string;
}

export default function Dashboard() {
  const [selectedPot, setSelectedPot] = useState<Pot | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showCreatePotModal, setShowCreatePotModal] = useState(false);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [showEditPotModal, setShowEditPotModal] = useState(false);

  // Get wallet connection status and user role
  const { isConnected } = useAccount();
  const { roleInfo } = useUserRole();

  // Read pot details from contract
  const { data: potsData, isLoading: isLoadingPots, refetch: refetchPots } = useReadContracts({
    contracts: POT_IDS.map((potId) => ({
      address: treasuryVaultAddress,
      ...treasuryContract,
      functionName: "getPotDetails",
      args: [stringToBytes32(potId)],
    })),
    query: {
      refetchInterval: 5000, // Auto-refresh every 5 seconds
    },
  });

  // Read treasury balance using custom hook
  const { balance, isLoading: isLoadingBalance, isError: isBalanceError, refetch: refetchBalance } = useTreasuryBalance();

  // Debug logging
  useEffect(() => {
    console.log("[Dashboard] Wallet connected:", isConnected);
    console.log("[Dashboard] User role:", roleInfo.label);
    console.log("[Dashboard] Balance:", balance);
    console.log("[Dashboard] Balance loading:", isLoadingBalance);
    console.log("[Dashboard] Balance error:", isBalanceError);
  }, [isConnected, roleInfo, balance, isLoadingBalance, isBalanceError]);

  // Transform contract data into Pot objects
  const pots: Pot[] = POT_IDS.map((potId, index) => {
    const potData = potsData?.[index];

    // If data not loaded yet or failed, return empty pot
    if (potData?.status !== "success") {
      return {
        id: potId,
        name: POT_NAMES[potId],
        budget: 0n,
        spent: 0n,
        threshold: 0n,
        color: POT_COLORS[potId],
      };
    }

    // Extract real contract data: [budget, spent, threshold]
    const [budget, spent, threshold] = potData.result as [bigint, bigint, bigint];

    return {
      id: potId,
      name: POT_NAMES[potId],
      budget,
      spent,
      threshold,
      color: POT_COLORS[potId],
    };
  });

  const handleMakePayment = (pot: Pot, batch = false) => {
    setSelectedPot(pot);
    setIsBatchMode(batch);
    if (batch) {
      setShowBatchModal(true);
    } else {
      setShowSingleModal(true);
    }
  };

  const handleManageBeneficiaries = (pot: Pot) => {
    setSelectedPot(pot);
    setShowBeneficiaryModal(true);
  };

  const handleEditPot = (pot: Pot) => {
    setSelectedPot(pot);
    setShowEditPotModal(true);
  };

  return (
    <div className="space-y-8">
      {/* Treasury Funding Section with Bank Account Balance (CFO Only) */}
      {roleInfo.permissions.depositFunds && (
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <TreasuryFunding />
          </div>
          <div className="w-80">
            <BankAccountBalance />
          </div>
        </div>
      )}

      {/* Total Treasury Balance (Web3) */}
      <Card className="card-shadow border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium">Total Treasury Balance</CardDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchBalance()}
              disabled={isLoadingBalance}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardTitle className="text-5xl font-bold text-financial">
            {isLoadingBalance ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="text-2xl text-gray-400">Loading...</span>
              </div>
            ) : isBalanceError ? (
              <div className="flex flex-col gap-1">
                <span className="text-2xl text-red-600">Error loading balance</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Check console for details
                </span>
              </div>
            ) : (
              `$${formatNumber(parseFloat(balance))}`
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-success">
                <ArrowUpRight className="h-4 w-4" />
                <span className="font-medium">USDC</span>
              </div>
              <span className="text-muted-foreground">on Arc Network</span>
            </div>
            <a
              href={getExplorerAddressUrl(treasuryVaultAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View on Arc Testnet
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Chain Balances */}
      <MultiChainBalances />

      {/* Department Pots (Web3) */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Department Budgets</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={() => setShowCreatePotModal(true)}
                  size="sm"
                  disabled={!roleInfo.permissions.createPots}
                >
                  {!roleInfo.permissions.createPots && <Lock className="mr-2 h-4 w-4" />}
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Pot
                </Button>
              </span>
            </TooltipTrigger>
            {!roleInfo.permissions.createPots && (
              <TooltipContent>
                <p>Only CFO can create new department pots</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
        {isLoadingPots ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading pot budgets from contract...</span>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pots.map((pot) => {
              const available = pot.budget - pot.spent;
              const percentSpent = pot.budget > 0n ? Number((pot.spent * 100n) / pot.budget) : 0;

              return (
                <Card key={pot.id} className="card-shadow card-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{pot.name}</CardTitle>
                        <CardDescription className="mt-1">Department Budget</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEditPot(pot)}
                              disabled={!roleInfo.permissions.createPots}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          {!roleInfo.permissions.createPots ? (
                            <TooltipContent>
                              <p>Only CFO can edit pots</p>
                            </TooltipContent>
                          ) : (
                            <TooltipContent>
                              <p>Edit pot settings</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: pot.color }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-semibold text-financial">
                          {formatUSDC(pot.budget)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-semibold text-financial">
                          {formatUSDC(pot.spent)}
                        </span>
                      </div>
                      <Progress value={percentSpent} className="h-2" />
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-success">Available</span>
                        <span className="text-success text-financial">
                          {formatUSDC(available)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-full">
                            <Button
                              onClick={() => handleMakePayment(pot, false)}
                              className="w-full"
                              size="sm"
                              disabled={!roleInfo.permissions.submitPayments}
                            >
                              {!roleInfo.permissions.submitPayments && <Lock className="mr-2 h-4 w-4" />}
                              <DollarSign className="mr-2 h-4 w-4" />
                              Make Payment
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!roleInfo.permissions.submitPayments && (
                          <TooltipContent>
                            <p>Only CFO and VPs can submit payments</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                      {pot.id === "engineering" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="w-full">
                              <Button
                                onClick={() => handleMakePayment(pot, true)}
                                variant="outline"
                                className="w-full"
                                size="sm"
                                disabled={!roleInfo.permissions.submitPayments}
                              >
                                {!roleInfo.permissions.submitPayments && <Lock className="mr-2 h-4 w-4" />}
                                Batch Payment (Payroll)
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!roleInfo.permissions.submitPayments && (
                            <TooltipContent>
                              <p>Only CFO and VPs can submit payments</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-full">
                            <Button
                              onClick={() => handleManageBeneficiaries(pot)}
                              variant="ghost"
                              className="w-full"
                              size="sm"
                              disabled={!roleInfo.permissions.createPots}
                            >
                              {!roleInfo.permissions.createPots && <Lock className="mr-2 h-4 w-4" />}
                              <Users className="mr-2 h-4 w-4" />
                              Manage Beneficiaries
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!roleInfo.permissions.createPots && (
                          <TooltipContent>
                            <p>Only CFO can manage beneficiaries</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedPot && (
        <>
          <SinglePaymentModal
            open={showSingleModal}
            onOpenChange={setShowSingleModal}
            pot={selectedPot}
            treasuryBalance={balance ? BigInt(Math.floor(parseFloat(balance) * 1_000_000)) : 0n}
            onSuccess={() => refetchPots()}
          />
          <BatchPaymentModal
            open={showBatchModal}
            onOpenChange={setShowBatchModal}
            pot={selectedPot}
            onSuccess={() => refetchPots()}
          />
          <BeneficiaryManagement
            open={showBeneficiaryModal}
            onOpenChange={setShowBeneficiaryModal}
            potId={selectedPot.id}
            potName={selectedPot.name}
          />
          <EditPotModal
            open={showEditPotModal}
            onOpenChange={setShowEditPotModal}
            pot={selectedPot}
            onSuccess={() => refetchPots()}
          />
        </>
      )}

      <CreatePotModal
        open={showCreatePotModal}
        onOpenChange={setShowCreatePotModal}
        onSuccess={() => refetchPots()}
      />
    </div>
  );
}
