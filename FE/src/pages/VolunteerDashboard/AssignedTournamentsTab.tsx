import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar, MapPin, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { volunteerAPI, handleAPIError, Tournament } from "@/services/api";

const AssignedTournamentsTab = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedTournaments();
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchAssignedTournaments();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAssignedTournaments = async () => {
    try {
      setLoading(true);
      // Get volunteer ID from localStorage
      // The app stores userId in localStorage with key "userId" (from RoleLogin.tsx)
      const volunteerId = localStorage.getItem("userId");
      
      if (!volunteerId) {
        toast.error("User not logged in. Please log in again.");
        return;
      }

      const response = await volunteerAPI.getVolunteerTournaments(volunteerId);
      if (response.success) {
        setTournaments(response.data.tournaments);
      } else {
        toast.error(response.message || "Failed to load assigned tournaments");
      }
    } catch (error) {
      console.error("Error fetching assigned tournaments:", error);
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = start.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-600';
      case 'declined':
        return 'bg-red-500/10 text-red-600';
      case 'completed':
        return 'bg-blue-500/10 text-blue-600';
      default:
        return 'bg-yellow-500/10 text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'declined':
        return <XCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTournamentStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now >= start && now <= end) {
      return 'In Progress';
    } else if (now < start) {
      return 'Upcoming';
    } else {
      return 'Completed';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assigned tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Assigned Tournaments</h2>
          <p className="text-muted-foreground">Tournaments you've been assigned to volunteer for</p>
        </div>
        <button
          onClick={fetchAssignedTournaments}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {tournaments.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No assigned tournaments</h3>
          <p className="text-muted-foreground">
            You haven't been assigned to any tournaments yet. Check back later!
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tournaments.map((assignment) => {
            const tournament = assignment.tournament as Tournament;
            const tournamentStatus = getTournamentStatus(tournament.startDate, tournament.endDate);
            
            return (
              <Card key={assignment._id} className="glass-card glass-hover">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{tournament.name}</h3>
                          <span className={`text-xs px-3 py-1 rounded-full ${
                            tournamentStatus === 'In Progress' 
                              ? 'bg-green-500/10 text-green-600' 
                              : tournamentStatus === 'Upcoming'
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'bg-gray-500/10 text-gray-600'
                          }`}>
                            {tournamentStatus}
                          </span>
                          <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${getStatusColor(assignment.status)}`}>
                            {getStatusIcon(assignment.status)}
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Trophy className="h-4 w-4" />
                            {tournament.division}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDateRange(tournament.startDate, tournament.endDate)}
                          </span>
                          {tournament.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {tournament.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-1">Your Role</div>
                        <div className="text-lg font-bold">{assignment.role}</div>
                      </div>
                      {assignment.notes && (
                        <div>
                          <div className="text-sm font-semibold text-muted-foreground mb-1">Notes</div>
                          <div className="text-sm">{assignment.notes}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-1">Assigned Date</div>
                        <div className="text-sm">{new Date(assignment.assignedAt).toLocaleDateString()}</div>
                      </div>
                      {assignment.assignedBy && (
                        <div>
                          <div className="text-sm font-semibold text-muted-foreground mb-1">Assigned By</div>
                          <div className="text-sm">
                            {assignment.assignedBy.firstName} {assignment.assignedBy.lastName}
                          </div>
                        </div>
                      )}
                    </div>

                    {tournament.description && (
                      <div className="pt-4 border-t border-border">
                        <div className="text-sm font-semibold text-muted-foreground mb-1">Description</div>
                        <div className="text-sm">{tournament.description}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssignedTournamentsTab;

