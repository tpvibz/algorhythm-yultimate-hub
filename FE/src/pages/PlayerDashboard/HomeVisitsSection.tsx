import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Calendar, User, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_BASE_URL } from "@/services/api";

interface HomeVisitsSectionProps {
  playerId: string;
}

const HomeVisitsSection = ({ playerId }: HomeVisitsSectionProps) => {
  const [homeVisits, setHomeVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeVisits();
  }, [playerId]);

  const fetchHomeVisits = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/player/${playerId}/home-visits`);
      if (response.ok) {
        const data = await response.json();
        setHomeVisits(data);
      } else {
        toast.error("Failed to load home visits");
      }
    } catch (error) {
      console.error("Error fetching home visits:", error);
      toast.error("Error loading home visits");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Home Visits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card glass-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Home Visits
        </CardTitle>
      </CardHeader>
      <CardContent>
        {homeVisits.length === 0 ? (
          <div className="text-center py-12">
            <Home className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No home visits recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {homeVisits.map((visit) => (
              <div
                key={visit._id}
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-muted"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">
                      {format(new Date(visit.visitDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                  {visit.visitedBy && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{visit.visitedBy.name}</span>
                    </div>
                  )}
                </div>

                {visit.notes && (
                  <div className="mt-3 p-3 rounded-lg bg-purple-500/5">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p>
                        <p className="text-sm">{visit.notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {visit.remarks && (
                  <div className="mt-2 p-3 rounded-lg bg-blue-500/5">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Remarks:</p>
                    <p className="text-sm">{visit.remarks}</p>
                  </div>
                )}

                {visit.durationMinutes && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Duration: {visit.durationMinutes} minutes
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HomeVisitsSection;

