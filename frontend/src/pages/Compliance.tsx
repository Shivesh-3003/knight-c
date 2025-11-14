import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Shield, Lock, AlertCircle } from "lucide-react";

const MOCK_REPORTS = [
  {
    id: "1",
    name: "Q4 2024 Audit Trail",
    date: "2024-11-15",
    type: "Quarterly Audit",
    transactions: 234,
    size: "2.4 MB",
  },
  {
    id: "2",
    name: "October 2024 Treasury Report",
    date: "2024-11-01",
    type: "Monthly Report",
    transactions: 89,
    size: "1.1 MB",
  },
  {
    id: "3",
    name: "Payment Activity Log",
    date: "2024-11-14",
    type: "Activity Log",
    transactions: 156,
    size: "1.8 MB",
  },
];

export default function Compliance() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance & Auditing</h1>
          <p className="mt-2 text-muted-foreground">
            Immutable audit trails and instant compliance report generation
          </p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              Multi-Sig Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground mt-1">
              All high-value payments require 2/3 approvals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-accent" />
              Beneficiary Whitelist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 Addresses</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pre-approved payment recipients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">
              Payments awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
        <div className="space-y-3">
          {MOCK_REPORTS.map((report) => (
            <Card key={report.id} className="card-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">{report.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {report.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {report.transactions} transactions
                      </span>
                      <span className="text-xs text-muted-foreground">{report.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{report.date}</span>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Audit Trail Info */}
      <Card className="border-accent/50 bg-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            Immutable Audit Trail
          </CardTitle>
          <CardDescription>
            All treasury operations are permanently recorded on-chain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Instant Report Generation</p>
              <p className="text-xs text-muted-foreground">
                Generate comprehensive audit reports in seconds, not hours
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Full Transaction History</p>
              <p className="text-xs text-muted-foreground">
                Complete record of all payments, approvals, and reallocations
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Multi-Sig Transparency</p>
              <p className="text-xs text-muted-foreground">
                Track all approvals and signers for high-value payments
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Regulatory Ready</p>
              <p className="text-xs text-muted-foreground">
                Export data in formats compatible with accounting systems
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
