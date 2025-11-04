import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { teamAPI, TeamWithStats, handleAPIError } from "@/services/api";
import { toast } from "sonner";

const Teams = () => {
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getAllTeams();
      if (response.success) {
        setTeams(response.data.teams);
      } else {
        toast.error(response.message || "Failed to load teams");
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Teams</h1>
          <button
            onClick={fetchTeams}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading teams...</p>
            </div>
          </div>
        ) : teams.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams found</h3>
            <p className="text-muted-foreground">
              There are no teams registered in the system yet.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team, index) => (
              <Card key={index} className="glass-card glass-hover p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold truncate">{team.teamName}</h3>
                    <p className="text-muted-foreground text-sm">
                      {team.players.length} {team.players.length === 1 ? 'player' : 'players'}
                    </p>
                  </div>
                </div>

                {/* Players List */}
                {team.players.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Players:</h4>
                    <div className="space-y-1">
                      {team.players.slice(0, 5).map((player, playerIndex) => (
                        <div key={playerIndex} className="text-sm truncate">
                          • {player}
                        </div>
                      ))}
                      {team.players.length > 5 && (
                        <div className="text-sm text-muted-foreground">
                          +{team.players.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Wins:</span>
                    <span className="font-bold text-green-600">{team.wins}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Losses:</span>
                    <span className="font-bold text-red-600">{team.losses}</span>
                  </div>
                  {team.wins + team.losses > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">Win Rate:</span>
                      <span className="font-bold text-primary">
                        {Math.round((team.wins / (team.wins + team.losses)) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Teams;
