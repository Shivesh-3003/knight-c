import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Repeat, Zap, Rocket } from "lucide-react";

const MOCK_FLOWS = [
  {
    id: "1",
    name: "Bi-weekly Payroll",
    frequency: "Every 2 weeks",
    nextRun: "2024-11-28",
    amount: 180000,
    recipients: 15,
    status: "active",
  },
  {
    id: "2",
    name: "Monthly Agency Retainer",
    frequency: "Monthly",
    nextRun: "2024-12-01",
    amount: 45000,
    recipients: 1,
    status: "active",
  },
  {
    id: "3",
    name: "Quarterly Bonuses",
    frequency: "Quarterly",
    nextRun: "2025-01-01",
    amount: 250000,
    recipients: 8,
    status: "scheduled",
  },
];

export default function ScheduledFlows() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduled Flows</h1>
          <p className="mt-2 text-muted-foreground">
            Automated recurring payments configured with on-chain keepers
          </p>
        </div>
        <Button>
          <Zap className="mr-2 h-4 w-4" />
          New Flow
        </Button>
      </div>

      <Alert className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
        <Rocket className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        <AlertDescription className="ml-2">
          <span className="font-semibold text-purple-900 dark:text-purple-100">🚀 Roadmap Feature - Chainlink Automation</span>
          <p className="mt-1 text-sm text-purple-800 dark:text-purple-200">
            Automated recurring payments coming soon. This feature will use Chainlink Keepers for trustless on-chain scheduling.
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_FLOWS.map((flow) => (
          <Card key={flow.id} className="card-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <Repeat className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{flow.name}</CardTitle>
                    <CardDescription className="text-xs">{flow.frequency}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Run</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className="font-medium">{flow.nextRun}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold text-financial">
                    ${flow.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipients</span>
                  <span className="font-medium">{flow.recipients}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant={flow.status === "active" ? "default" : "secondary"}>
                  {flow.status}
                </Badge>
                <Button variant="ghost" size="sm">
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Configure Automated Flows</p>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
            Set up recurring payments that execute automatically on-chain using keeper networks
          </p>
          <Button className="mt-4" variant="outline">
            Learn More
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
