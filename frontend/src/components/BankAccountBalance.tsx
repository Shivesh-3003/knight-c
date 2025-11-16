import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const BANK_BALANCE_KEY = "knight-c-bank-balance";
const INITIAL_BANK_BALANCE = 100; // Starting with $100 as specified

interface BankAccountBalanceProps {
  onBalanceChange?: (newBalance: number) => void;
}

export function BankAccountBalance({ onBalanceChange }: BankAccountBalanceProps) {
  const [balance, setBalance] = useState<number>(() => {
    // Load from localStorage or use initial balance
    const stored = localStorage.getItem(BANK_BALANCE_KEY);
    return stored ? parseFloat(stored) : INITIAL_BANK_BALANCE;
  });

  // Sync to localStorage whenever balance changes
  useEffect(() => {
    localStorage.setItem(BANK_BALANCE_KEY, balance.toString());
    onBalanceChange?.(balance);
  }, [balance, onBalanceChange]);

  // Poll for localStorage changes to update balance in real-time (same window)
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem(BANK_BALANCE_KEY);
      if (stored) {
        const storedBalance = parseFloat(stored);
        if (storedBalance !== balance) {
          setBalance(storedBalance);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [balance]);

  // Export function to deduct from balance (will be called from TreasuryFunding)
  useEffect(() => {
    // Expose global function to deduct from bank balance
    (window as any).deductFromBankBalance = (amount: number) => {
      setBalance((prev) => Math.max(0, prev - amount));
    };
    (window as any).getBankBalance = () => balance;

    return () => {
      delete (window as any).deductFromBankBalance;
      delete (window as any).getBankBalance;
    };
  }, [balance]);

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Bank Account Balance</p>
            <p className="text-2xl font-bold text-financial">
              ${formatNumber(balance)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook to use bank balance in other components
export function useBankBalance() {
  const [balance, setBalance] = useState<number>(() => {
    const stored = localStorage.getItem(BANK_BALANCE_KEY);
    return stored ? parseFloat(stored) : INITIAL_BANK_BALANCE;
  });

  useEffect(() => {
    // Listen for storage changes
    const handleStorageChange = () => {
      const stored = localStorage.getItem(BANK_BALANCE_KEY);
      if (stored) {
        setBalance(parseFloat(stored));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const deductFromBalance = (amount: number) => {
    const newBalance = Math.max(0, balance - amount);
    setBalance(newBalance);
    localStorage.setItem(BANK_BALANCE_KEY, newBalance.toString());
    return newBalance;
  };

  const addToBalance = (amount: number) => {
    const newBalance = balance + amount;
    setBalance(newBalance);
    localStorage.setItem(BANK_BALANCE_KEY, newBalance.toString());
    return newBalance;
  };

  return {
    balance,
    deductFromBalance,
    addToBalance,
  };
}
