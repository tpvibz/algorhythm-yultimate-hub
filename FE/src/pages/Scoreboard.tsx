import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Target, Trophy, RefreshCw, Clock, MapPin, CheckCircle2, Calendar } from "lucide-react";
import { tournamentAPI, scheduleAPI, Match, Tournament, handleAPIError } from "@/services/api";
import { toast } from "sonner";
import MatchDetailModal from "@/components/MatchDetailModal";

const Scoreboard = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showMatchDetail, setShowMatchDetail] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      fetchMatches();
      // Poll for real-time updates every 3 seconds
      const interval = setInterval(() => {
        fetchMatches();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [selectedTournamentId]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getAllTournaments();
      if (response.success) {
        setTournaments(response.data.tournaments);
        // Auto-select first tournament if available
        if (response.data.tournaments.length > 0 && !selectedTournamentId) {
          setSelectedTournamentId(response.data.tournaments[0]._id);
        }
      } else {
        toast.error(response.message || "Failed to load tournaments");
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    if (!selectedTournamentId) return;

    try {
      const response = await scheduleAPI.getMatchesByTournament(selectedTournamentId);
      if (response.success) {
        setMatches(response.data.matches);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
      setMatches([]);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Filter matches
  const ongoingMatches = matches.filter(m => m.status === 'ongoing');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const scheduledMatches = matches.filter(m => m.status === 'scheduled');

  // Group matches by field
  const matchesByField = matches.reduce((acc, match) => {
    const field = match.fieldName || 'Unassigned';
    if (!acc[field]) {
      acc[field] = [];
    }
    acc[field].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const fields = Object.keys(matchesByField).sort();

  const selectedTournament = tournaments.find(t => t._id === selectedTournamentId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Live Scoreboard</h1>
          <div className="flex gap-4 items-center flex-wrap">
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a tournament" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament._id} value={tournament._id}>
                    {tournament.name} ({new Date(tournament.startDate).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={fetchMatches}
              variant="outline"
              disabled={loading || !selectedTournamentId}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {selectedTournament && (
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                {selectedTournament.division}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(selectedTournament.startDate).toLocaleDateString()} - {new Date(selectedTournament.endDate).toLocaleDateString()}
              </span>
              {selectedTournament.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {selectedTournament.location}
                </span>
              )}
            </div>
          )}
        </div>

        {!selectedTournamentId ? (
          <Card className="glass-card p-12 text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Tournament</h3>
            <p className="text-muted-foreground">
              Choose a tournament from the dropdown to view live scores
            </p>
          </Card>
        ) : matches.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground">
              No matches have been scheduled for this tournament yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Ongoing Matches */}
            {ongoingMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  Live Matches ({ongoingMatches.length})
                </h2>
                <div className="grid gap-6">
                  {ongoingMatches.map((match) => (
                    <Card 
                      key={match._id} 
                      className="glass-card glass-hover border-2 border-green-500/50 cursor-pointer transition-all hover:shadow-lg"
                      onClick={() => {
                        setSelectedMatch(match);
                        setShowMatchDetail(true);
                      }}
                    >
                      <CardContent className="p-8">
                        <div className="flex items-center justify-center gap-4 mb-6">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <span className="text-lg font-semibold">{match.fieldName || 'Field TBD'}</span>
                          <span className="text-muted-foreground">•</span>
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{formatTime(match.startTime)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <div className="flex-1 text-center">
                            <h4 className="text-2xl font-bold mb-3">{match.teamA.teamName}</h4>
                            <div className="text-7xl font-bold text-primary">{match.score?.teamA || 0}</div>
                          </div>
                          <div className="text-5xl font-bold text-muted-foreground">VS</div>
                          <div className="flex-1 text-center">
                            <h4 className="text-2xl font-bold mb-3">{match.teamB.teamName}</h4>
                            <div className="text-7xl font-bold text-primary">{match.score?.teamB || 0}</div>
                          </div>
                        </div>
                        <div className="mt-6 text-center">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-600 font-semibold">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Live Now
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Matches */}
            {completedMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  Completed Matches ({completedMatches.length})
                </h2>
                <div className="grid gap-6">
                  {completedMatches.map((match) => (
                    <Card 
                      key={match._id} 
                      className="glass-card glass-hover border border-border cursor-pointer transition-all hover:shadow-lg"
                      onClick={() => {
                        setSelectedMatch(match);
                        setShowMatchDetail(true);
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-center gap-4 mb-4">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{match.fieldName || 'Field TBD'}</span>
                          <span className="text-muted-foreground">•</span>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatDateTime(match.startTime)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <div className="flex-1 text-center">
                            <h4 className={`text-xl font-bold mb-2 ${
                              match.winnerTeamId === match.teamA._id ? 'text-green-600' : ''
                            }`}>
                              {match.teamA.teamName}
                            </h4>
                            <div className={`text-5xl font-bold ${
                              match.winnerTeamId === match.teamA._id ? 'text-green-600' : 'text-primary'
                            }`}>
                              {match.score?.teamA || 0}
                            </div>
                          </div>
                          <div className="text-4xl font-bold text-muted-foreground">VS</div>
                          <div className="flex-1 text-center">
                            <h4 className={`text-xl font-bold mb-2 ${
                              match.winnerTeamId === match.teamB._id ? 'text-green-600' : ''
                            }`}>
                              {match.teamB.teamName}
                            </h4>
                            <div className={`text-5xl font-bold ${
                              match.winnerTeamId === match.teamB._id ? 'text-green-600' : 'text-primary'
                            }`}>
                              {match.score?.teamB || 0}
                            </div>
                          </div>
                        </div>
                        {match.winnerTeamId && (
                          <div className="mt-4 text-center">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-600 font-semibold text-sm">
                              <Trophy className="h-4 w-4" />
                              Winner: {match.winnerTeamId === match.teamA._id ? match.teamA.teamName : match.teamB.teamName}
                            </span>
                          </div>
                        )}
                        {!match.winnerTeamId && match.score && match.score.teamA === match.score.teamB && (
                          <div className="mt-4 text-center">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-600 font-semibold text-sm">
                              Draw/Tie
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Matches (Optional - show next few) */}
            {ongoingMatches.length === 0 && completedMatches.length === 0 && scheduledMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Upcoming Matches</h2>
                <div className="grid gap-4">
                  {scheduledMatches.slice(0, 5).map((match) => (
                    <Card 
                      key={match._id} 
                      className="glass-card glass-hover cursor-pointer transition-all hover:shadow-lg"
                      onClick={() => {
                        setSelectedMatch(match);
                        setShowMatchDetail(true);
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h4 className="text-lg font-bold">{match.teamA.teamName}</h4>
                              <span className="text-muted-foreground">vs</span>
                              <h4 className="text-lg font-bold">{match.teamB.teamName}</h4>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {match.fieldName && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {match.fieldName}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDateTime(match.startTime)}
                              </span>
                            </div>
                          </div>
                          <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-600 text-sm font-semibold">
                            Scheduled
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Field-wise view (Alternative view) */}
            {fields.length > 1 && ongoingMatches.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">By Field</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fields.map((field) => {
                    const fieldMatches = matchesByField[field].filter(m => m.status === 'ongoing' || m.status === 'completed');
                    if (fieldMatches.length === 0) return null;

                    return (
                      <Card key={field} className="glass-card">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Target className="h-5 w-5 text-primary" />
                            <h3 className="text-xl font-semibold">{field}</h3>
                          </div>
                          <div className="space-y-4">
                            {fieldMatches.map((match) => (
                              <div 
                                key={match._id} 
                                className="space-y-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-all"
                                onClick={() => {
                                  setSelectedMatch(match);
                                  setShowMatchDetail(true);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-sm font-semibold ${
                                        match.winnerTeamId === match.teamA._id ? 'text-green-600' : ''
                                      }`}>
                                        {match.teamA.teamName}
                                      </span>
                                      <span className="text-sm">{match.score?.teamA || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm font-semibold ${
                                        match.winnerTeamId === match.teamB._id ? 'text-green-600' : ''
                                      }`}>
                                        {match.teamB.teamName}
                                      </span>
                                      <span className="text-sm">{match.score?.teamB || 0}</span>
                                    </div>
                                  </div>
                                  <div className={`text-xs px-2 py-1 rounded ${
                                    match.status === 'ongoing' 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-blue-500 text-white'
                                  }`}>
                                    {match.status}
                                  </div>
                                </div>
                                {match.status === 'ongoing' && (
                                  <div className="flex items-center gap-1 text-xs text-green-600">
                                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></div>
                                    Live
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Match Detail Modal */}
        <MatchDetailModal
          match={selectedMatch}
          open={showMatchDetail}
          onClose={() => {
            setShowMatchDetail(false);
            setSelectedMatch(null);
          }}
        />
      </main>
      <BottomNav />
    </div>
  );
};

export default Scoreboard;
