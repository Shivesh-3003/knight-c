import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, DollarSign } from "lucide-react";
import { SinglePaymentModal } from "@/components/SinglePaymentModal";
import { BatchPaymentModal } from "@/components/BatchPaymentModal";

const POTS = [
  {
    id: "engineering",
    name: "Engineering",
    budget: 2000000,
    spent: 1200000,
    color: "hsl(var(--chart-1))",
  },
  {
    id: "marketing",
    name: "Marketing",
    budget: 500000,
    spent: 380000,
    color: "hsl(var(--chart-2))",
  },
  {
    id: "operations",
    name: "Operations",
    budget: 800000,
    spent: 450000,
    color: "hsl(var(--chart-3))",
  },
];

export default function Dashboard() {
  const [selectedPot, setSelectedPot] = useState<typeof POTS[0] | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const totalTreasury = 10000000;

  const handleMakePayment = (pot: typeof POTS[0], batch = false) => {
    setSelectedPot(pot);
    setIsBatchMode(batch);
    if (batch) {
      setShowBatchModal(true);
    } else {
      setShowSingleModal(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Total Treasury */}
      <Card className="card-shadow border-2">
        <CardHeader className="pb-3">
          <CardDescription className="text-sm font-medium">Total Treasury Balance</CardDescription>
          <CardTitle className="text-5xl font-bold text-financial">
            {formatCurrency(totalTreasury)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-success">
              <ArrowUpRight className="h-4 w-4" />
              <span className="font-medium">USDC</span>
            </div>
            <span className="text-muted-foreground">on Arc Network</span>
          </div>
        </CardContent>
      </Card>

      {/* Department Pots */}
      <div>
        <h2 className="mb-4 text-2xl font-bold">Department Budgets</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {POTS.map((pot) => {
            const available = pot.budget - pot.spent;
            const percentSpent = (pot.spent / pot.budget) * 100;

            return (
              <Card key={pot.id} className="card-shadow card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{pot.name}</CardTitle>
                      <CardDescription className="mt-1">Department Budget</CardDescription>
                    </div>
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: pot.color }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Budget</span>
                      <span className="font-semibold text-financial">
                        {formatCurrency(pot.budget)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-semibold text-financial">
                        {formatCurrency(pot.spent)}
                      </span>
                    </div>
                    <Progress value={percentSpent} className="h-2" />
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-success">Available</span>
                      <span className="text-success text-financial">
                        {formatCurrency(available)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button
                      onClick={() => handleMakePayment(pot, false)}
                      className="w-full"
                      size="sm"
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Make Payment
                    </Button>
                    {pot.id === "engineering" && (
                      <Button
                        onClick={() => handleMakePayment(pot, true)}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        Batch Payment (Payroll)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedPot && (
        <>
          <SinglePaymentModal
            open={showSingleModal}
            onOpenChange={setShowSingleModal}
            pot={selectedPot}
          />
          <BatchPaymentModal
            open={showBatchModal}
            onOpenChange={setShowBatchModal}
            pot={selectedPot}
          />
        </>
      )}
    </div>
  );
}
