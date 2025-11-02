import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";

interface HomeVisit {
  _id: string;
  visitDate: string;
  notes: string;
  remarks: string;
  durationMinutes?: number;
  visitedBy: string;
  createdAt: string;
}

interface HomeVisitHistoryProps {
  studentId: string;
  homeVisits: HomeVisit[];
  onRefresh: () => void;
}

const HomeVisitHistory = ({ homeVisits }: HomeVisitHistoryProps) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  if (homeVisits.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">No home visits recorded yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Click "Log Home Visit" to record a visit
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {homeVisits.map((visit) => (
        <Card key={visit._id} className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="font-medium">{formatDate(visit.visitDate)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {visit.durationMinutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{visit.durationMinutes} min</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{visit.visitedBy}</span>
                </div>
              </div>
            </div>

            {visit.notes && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-start gap-2 mb-1">
                  <FileText className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p>
                    <p className="text-sm">{visit.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {visit.remarks && (
              <div className="mt-2 p-3 rounded-lg bg-orange-500/5">
                <p className="text-xs font-medium text-muted-foreground mb-1">Remarks:</p>
                <p className="text-sm">{visit.remarks}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3">
              Recorded: {formatDateTime(visit.createdAt)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HomeVisitHistory;

