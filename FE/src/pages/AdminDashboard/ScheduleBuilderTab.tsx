import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, Clock, Users, Trophy, Trash2, RefreshCw, PlayCircle, CheckCircle2, MapPin } from "lucide-react";
import { tournamentAPI, scheduleAPI, Tournament, Team, Match, handleAPIError } from "@/services/api";

const ScheduleBuilderTab = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [scheduleOptions, setScheduleOptions] = useState({
    scheduleFormat: "round-robin",
    poolsPerGroup: 2,
    matchDurationMinutes: 60
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      fetchTeams();
      fetchMatches();
    }
  }, [selectedTournamentId]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getAllTournaments();
      if (response.success) {
        setTournaments(response.data.tournaments);
      } else {
        toast.error(response.message || "Failed to load tournaments");
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    if (!selectedTournamentId) return;
    
    try {
      setTeamsLoading(true);
      const response = await scheduleAPI.getTeamsByTournament(selectedTournamentId);
      if (response.success) {
        setTeams(response.data.teams);
      } else {
        toast.error(response.message || "Failed to load teams");
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchMatches = async () => {
    if (!selectedTournamentId) return;
    
    try {
      setMatchesLoading(true);
      const response = await scheduleAPI.getMatchesByTournament(selectedTournamentId);
      if (response.success) {
        setMatches(response.data.matches);
      } else {
        // If no matches exist, that's okay - just set empty array
        if (response.message?.includes("not found")) {
          setMatches([]);
        } else {
          toast.error(response.message || "Failed to load matches");
        }
      }
    } catch (error) {
      // If error is 404, that's fine - no matches yet
      setMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!selectedTournamentId) {
      toast.error("Please select a tournament");
      return;
    }

    if (teams.length < 2) {
      toast.error("At least 2 teams are required to generate a schedule");
      return;
    }

    if (matches.length > 0) {
      const confirmDelete = window.confirm(
        `There are ${matches.length} existing matches. Do you want to delete them and generate a new schedule?`
      );
      if (!confirmDelete) return;

      try {
        await scheduleAPI.deleteMatchesByTournament(selectedTournamentId);
        toast.success("Existing matches deleted");
      } catch (error) {
        toast.error("Failed to delete existing matches");
        return;
      }
    }

    try {
      setLoading(true);
      const response = await scheduleAPI.generateSchedule(selectedTournamentId, scheduleOptions);
      if (response.success) {
        toast.success(`Successfully generated ${response.data.matchCount} matches!`);
        fetchMatches();
        fetchTournaments(); // Refresh to update tournament status
      } else {
        toast.error(response.message || "Failed to generate schedule");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || handleAPIError(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatches = async () => {
    if (!selectedTournamentId || matches.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete all ${matches.length} matches for this tournament?`
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const response = await scheduleAPI.deleteMatchesByTournament(selectedTournamentId);
      if (response.success) {
        toast.success(`Deleted ${response.deletedCount} matches`);
        fetchMatches();
      } else {
        toast.error(response.message || "Failed to delete matches");
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const selectedTournament = tournaments.find(t => t._id === selectedTournamentId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Schedule Builder</h2>
          <p className="text-muted-foreground">Generate match schedules for tournaments</p>
        </div>
      </div>

      {/* Tournament Selection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Select Tournament
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tournament-select">Tournament</Label>
              <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
                <SelectTrigger id="tournament-select" className="mt-2">
                  <SelectValue placeholder="Select a tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((tournament) => (
                    <SelectItem key={tournament._id} value={tournament._id}>
                      {tournament.name} ({tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTournament && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedTournament.startDate && selectedTournament.endDate
                      ? `${new Date(selectedTournament.startDate).toLocaleDateString()} - ${new Date(selectedTournament.endDate).toLocaleDateString()}`
                      : "Dates not set"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Format: {selectedTournament.format}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Registered Teams: {teamsLoading ? "Loading..." : teams.length} / {selectedTournament.maxTeams}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teams List */}
      {selectedTournamentId && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registered Teams ({teams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <p className="text-sm text-muted-foreground">Loading teams...</p>
            ) : teams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                  <div key={team._id} className="p-4 rounded-lg bg-muted/50 border border-border">
                    <h3 className="font-semibold mb-2">{team.teamName}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Members: {team.totalMembers}</p>
                      <p>Players: {team.players.length}</p>
                      {team.contactEmail && <p>Email: {team.contactEmail}</p>}
                      {team.coachId && (
                        <p>
                          Coach: {team.coachId.firstName} {team.coachId.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No teams registered for this tournament</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedule Options */}
      {selectedTournamentId && teams.length >= 2 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Schedule Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="schedule-format">Schedule Format</Label>
                <Select
                  value={scheduleOptions.scheduleFormat}
                  onValueChange={(value) =>
                    setScheduleOptions({ ...scheduleOptions, scheduleFormat: value })
                  }
                >
                  <SelectTrigger id="schedule-format" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round-robin">Round Robin</SelectItem>
                    <SelectItem value="pool-play-bracket">Pool Play</SelectItem>
                    <SelectItem value="single-elimination">Single Elimination</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scheduleOptions.scheduleFormat === "pool-play-bracket" && (
                <div>
                  <Label htmlFor="pools-per-group">Pools Per Group</Label>
                  <Input
                    id="pools-per-group"
                    type="number"
                    min="2"
                    max="8"
                    value={scheduleOptions.poolsPerGroup}
                    onChange={(e) =>
                      setScheduleOptions({
                        ...scheduleOptions,
                        poolsPerGroup: parseInt(e.target.value) || 2
                      })
                    }
                    className="mt-2"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="match-duration">Match Duration (minutes)</Label>
                <Input
                  id="match-duration"
                  type="number"
                  min="30"
                  max="120"
                  step="15"
                  value={scheduleOptions.matchDurationMinutes}
                  onChange={(e) =>
                    setScheduleOptions({
                      ...scheduleOptions,
                      matchDurationMinutes: parseInt(e.target.value) || 60
                    })
                  }
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleGenerateSchedule}
                disabled={loading || teams.length < 2}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                Generate Schedule
              </Button>

              {matches.length > 0 && (
                <Button
                  onClick={handleDeleteMatches}
                  disabled={loading}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Matches
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matches List - Grouped by Rounds */}
      {selectedTournamentId && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tournament Bracket ({matches.length} matches)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matchesLoading ? (
              <p className="text-sm text-muted-foreground">Loading matches...</p>
            ) : matches.length > 0 ? (
              (() => {
                // Group matches by round
                const matchesByRound = matches.reduce((acc, match) => {
                  const roundName = match.roundName || `Round ${match.round || 1}`;
                  if (!acc[roundName]) {
                    acc[roundName] = [];
                  }
                  acc[roundName].push(match);
                  return acc;
                }, {} as Record<string, Match[]>);

                // Sort rounds by round number
                const sortedRounds = Object.keys(matchesByRound).sort((a, b) => {
                  const roundA = matches.find(m => m.roundName === a)?.round || 0;
                  const roundB = matches.find(m => m.roundName === b)?.round || 0;
                  return roundA - roundB;
                });

                return (
                  <div className="space-y-8">
                    {sortedRounds.map((roundName) => {
                      const roundMatches = matchesByRound[roundName].sort((a, b) => {
                        if (a.bracketPosition && b.bracketPosition) {
                          return a.bracketPosition - b.bracketPosition;
                        }
                        if (a.matchNumber && b.matchNumber) {
                          return a.matchNumber - b.matchNumber;
                        }
                        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
                      });

                      const completedCount = roundMatches.filter(m => m.status === 'completed').length;
                      const totalCount = roundMatches.length;

                      return (
                        <div key={roundName} className="space-y-4">
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                              <Trophy className="h-5 w-5" />
                              {roundName}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              {completedCount} / {totalCount} completed
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {roundMatches.map((match) => (
                              <div
                                key={match._id}
                                className={`p-4 rounded-lg border transition-all ${
                                  match.status === 'completed'
                                    ? 'bg-green-500/10 border-green-500/20'
                                    : match.status === 'ongoing'
                                    ? 'bg-yellow-500/10 border-yellow-500/20'
                                    : 'bg-blue-500/5 border-border hover:bg-blue-500/10'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {match.matchNumber ? `Match ${match.matchNumber}` : match.bracketPosition ? `Position ${match.bracketPosition}` : ''}
                                    {match.pool && ` • Pool ${match.pool}`}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    match.status === "completed"
                                      ? "bg-green-600 text-white"
                                      : match.status === "ongoing"
                                      ? "bg-yellow-600 text-white"
                                      : "bg-blue-600 text-white"
                                  }`}>
                                    {match.status === "completed" ? (
                                      <span className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Completed
                                      </span>
                                    ) : match.status === "ongoing" ? (
                                      "Live"
                                    ) : (
                                      "Scheduled"
                                    )}
                                  </span>
                                </div>
                                
                                <div className="space-y-2 mb-3">
                                  <div className={`flex justify-between items-center p-2 rounded ${
                                    match.winnerTeamId === match.teamA._id ? 'bg-green-500/20 font-bold' : 'bg-secondary/20'
                                  }`}>
                                    <span className="truncate">{match.teamA.teamName}</span>
                                    <span className="font-bold ml-2">{match.score?.teamA || 0}</span>
                                  </div>
                                  <div className={`flex justify-between items-center p-2 rounded ${
                                    match.winnerTeamId === match.teamB._id ? 'bg-green-500/20 font-bold' : 'bg-secondary/20'
                                  }`}>
                                    <span className="truncate">{match.teamB.teamName}</span>
                                    <span className="font-bold ml-2">{match.score?.teamB || 0}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDateTime(match.startTime)}
                                  </div>
                                  {match.fieldName && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {match.fieldName}
                                    </span>
                                  )}
                                </div>

                                {match.status === 'completed' && match.winnerTeamId && (
                                  <div className="mt-2 pt-2 border-t border-border">
                                    <span className="text-xs font-semibold text-green-600">
                                      Winner: {match.winnerTeamId === match.teamA._id ? match.teamA.teamName : match.teamB.teamName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No matches scheduled yet. Generate a schedule to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduleBuilderTab;

