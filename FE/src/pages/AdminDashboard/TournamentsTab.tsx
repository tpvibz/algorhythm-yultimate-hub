import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Target, Calendar, Settings, Plus, Loader2, Users } from "lucide-react";
import { Tournament } from "@/services/api";
import CreateTournament from "@/components/CreateTournament";
import MatchManagementModal from "./MatchManagementModal";
import AssignVolunteersModal from "./AssignVolunteersModal";

interface TournamentsTabProps {
  tournaments: Tournament[];
  tournamentsLoading: boolean;
  onTournamentSuccess: () => void;
}

const TournamentsTab = ({ tournaments, tournamentsLoading, onTournamentSuccess }: TournamentsTabProps) => {
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showMatchManagement, setShowMatchManagement] = useState(false);
  const [showAssignVolunteers, setShowAssignVolunteers] = useState(false);

  // Format date range for tournaments
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

  // Get tournament status
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tournament Management</h2>
        <button 
          onClick={() => setShowCreateTournament(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Tournament
        </button>
      </div>

      {showCreateTournament && (
        <CreateTournament 
          onClose={() => setShowCreateTournament(false)}
          onSuccess={() => {
            setShowCreateTournament(false);
            onTournamentSuccess();
          }}
        />
      )}

      {tournamentsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading tournaments...</p>
          </div>
        </div>
      ) : tournaments.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tournaments yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first tournament to get started managing events.
          </p>
          <button 
            onClick={() => setShowCreateTournament(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Tournament
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tournaments.map((tournament) => {
            const status = getTournamentStatus(tournament.startDate, tournament.endDate);
            return (
              <Card key={tournament._id} className="glass-card glass-hover">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{tournament.name}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          status === 'In Progress' 
                            ? 'bg-green-500/10 text-green-600' 
                            : status === 'Upcoming'
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-gray-500/10 text-gray-600'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {tournament.registeredTeams?.length || 0}/{tournament.maxTeams} teams
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDateRange(tournament.startDate, tournament.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          {tournament.division}
                        </span>
                      </div>
                      {tournament.location && (
                        <p className="text-sm text-muted-foreground">
                          📍 {tournament.location}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setShowMatchManagement(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Settings className="h-4 w-4 inline mr-2" />
                        Manage
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setShowAssignVolunteers(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Users className="h-4 w-4 inline mr-2" />
                        Assign Volunteers
                      </button>
                      <button className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Match Management Modal */}
      <MatchManagementModal
        tournament={selectedTournament}
        open={showMatchManagement}
        onClose={() => {
          setShowMatchManagement(false);
          setSelectedTournament(null);
        }}
      />

      {/* Assign Volunteers Modal */}
      <AssignVolunteersModal
        tournament={selectedTournament}
        open={showAssignVolunteers}
        onClose={() => {
          setShowAssignVolunteers(false);
          setSelectedTournament(null);
        }}
        onSuccess={() => {
          // Optionally refresh tournaments or show success message
        }}
      />
    </div>
  );
};

export default TournamentsTab;

