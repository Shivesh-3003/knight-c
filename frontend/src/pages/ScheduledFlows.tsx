import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, Repeat, Zap, Rocket, Trash2 } from "lucide-react";
import { CreateFlowModal } from "@/components/CreateFlowModal";
import { useFlowStore, Flow } from "@/stores/flowStore";
import { toast } from "sonner";

export default function ScheduledFlows() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { flows, deleteFlow } = useFlowStore();
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [flowToDelete, setFlowToDelete] = useState<Flow | null>(null);

  const handleConfigureClick = (flow: Flow) => {
    setEditingFlow(flow);
    setIsModalOpen(true);
  };

  const handleNewFlowClick = () => {
    setEditingFlow(null);
    setIsModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      setEditingFlow(null);
    }
    setIsModalOpen(open);
  };

  const handleDeleteFlow = () => {
    if (flowToDelete) {
      deleteFlow(flowToDelete.id);
      toast.success("Flow Deleted!", { description: `The flow "${flowToDelete.name}" has been deleted.` });
      setFlowToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scheduled Flows</h1>
            <p className="mt-2 text-muted-foreground">
              Automated recurring payments configured with on-chain keepers
            </p>
          </div>
          <Button onClick={handleNewFlowClick}>
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
          {flows.map((flow) => (
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
                      ${(flow.totalAmount ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipients</span>
                    <span className="font-medium">
                      {Array.isArray(flow.recipients) ? flow.recipients.length : 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant={flow.status === "active" ? "default" : "secondary"}>
                    {flow.status}
                  </Badge>
                  <div className="flex items-center gap-2"> {/* Added gap-2 for spacing */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setFlowToDelete(flow)}> {/* Changed size to "sm" */}
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the flow
                            <span className="font-semibold"> {flowToDelete?.name}</span>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setFlowToDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteFlow}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" size="sm" onClick={() => handleConfigureClick(flow)}>
                      Configure
                    </Button>
                  </div>
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

        <CreateFlowModal
          open={isModalOpen}
          onOpenChange={handleModalOpenChange}
          flowToEdit={editingFlow}
        />
      </div>
    </>
  );
}
