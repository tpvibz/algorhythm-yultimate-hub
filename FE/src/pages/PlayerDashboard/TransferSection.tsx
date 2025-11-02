import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, Clock, CheckCircle2, XCircle, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import TransferRequestDialog from "./TransferRequestDialog";

interface TransferSectionProps {
  playerId: string;
  player: any;
  onRefresh: () => void;
}

const TransferSection = ({ playerId, player, onRefresh }: TransferSectionProps) => {
  const [transferHistory, setTransferHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  useEffect(() => {
    fetchTransferHistory();
  }, [playerId]);

  const fetchTransferHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/player/${playerId}/transfer-history`);
      if (response.ok) {
        const data = await response.json();
        setTransferHistory(data);
      } else {
        toast.error("Failed to load transfer history");
      }
    } catch (error) {
      console.error("Error fetching transfer history:", error);
      toast.error("Error loading transfer history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card glass-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer History
            </CardTitle>
            {(!transferHistory?.transferRequest || transferHistory.transferRequest.status !== "pending") && (
              <button
                onClick={() => setShowRequestDialog(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Request Transfer
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Transfer Request */}
          {transferHistory?.transferRequest && transferHistory.transferRequest.status && (
            <div className="p-4 rounded-lg bg-muted/50 border border-muted">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(transferHistory.transferRequest.status)}
                  <span className="font-medium">Current Transfer Request</span>
                </div>
                {getStatusBadge(transferHistory.transferRequest.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-medium">
                    {transferHistory.transferRequest.from.name} ({transferHistory.transferRequest.from.location})
                  </span>
                </div>
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground ml-1" />
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-medium">
                    {transferHistory.transferRequest.to.name} ({transferHistory.transferRequest.to.location})
                  </span>
                </div>
                {transferHistory.transferRequest.requestedOn && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Requested: {format(new Date(transferHistory.transferRequest.requestedOn), "MMM dd, yyyy")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Transfer History */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4" />
              <h3 className="font-medium">Previous Transfers</h3>
            </div>
            {transferHistory?.transferHistory?.length > 0 ? (
              <div className="space-y-3">
                {transferHistory.transferHistory.map((transfer: any, index: number) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/30 border border-muted">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">From:</span>
                        <span className="font-medium">{transfer.from.name} ({transfer.from.location})</span>
                      </div>
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground ml-1" />
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">To:</span>
                        <span className="font-medium">{transfer.to.name} ({transfer.to.location})</span>
                      </div>
                      {transfer.date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Transferred: {format(new Date(transfer.date), "MMM dd, yyyy")}
                        </p>
                      )}
                      {transfer.reason && (
                        <p className="text-xs text-muted-foreground mt-1">Reason: {transfer.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No previous transfers</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showRequestDialog && (
        <TransferRequestDialog
          open={showRequestDialog}
          onOpenChange={setShowRequestDialog}
          player={player}
          onSuccess={() => {
            fetchTransferHistory();
            onRefresh();
          }}
        />
      )}
    </>
  );
};

export default TransferSection;

