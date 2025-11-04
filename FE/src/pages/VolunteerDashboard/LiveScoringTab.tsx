import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Trophy, 
  Play, 
  Pause, 
  CheckCircle2, 
  Plus, 
  Minus, 
  RefreshCw, 
  Clock,
  MapPin,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { scoreAPI, scheduleAPI, matchAttendanceAPI, Match, handleAPIError } from "@/services/api";
import { Link } from "react-router-dom";

const LiveScoringTab = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);

  useEffect(() => {
    fetchMatches();
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchMatches();
      if (selectedMatch) {
        fetchMatchDetails(selectedMatch._id);
        checkAttendanceStatus(selectedMatch._id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedMatch]);

  useEffect(() => {
    if (selectedMatch) {
      checkAttendanceStatus(selectedMatch._id);
    }
  }, [selectedMatch]);

  const fetchMatches = async () => {
    try {
      const volunteerId = localStorage.getItem("userId");
      if (!volunteerId) {
        toast.error("User not logged in");
        return;
      }

      const response = await scoreAPI.getVolunteerMatches(volunteerId);
      if (response.success) {
        setMatches(response.data.matches);
      } else {
        toast.error(response.message || "Failed to load matches");
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchDetails = async (matchId: string) => {
    try {
      const response = await scheduleAPI.getMatchesByTournament(selectedMatch?.tournamentId || "");
      if (response.success) {
        const updatedMatch = response.data.matches.find((m: Match) => m._id === matchId);
        if (updatedMatch) {
          setSelectedMatch(updatedMatch);
          setMatches((prev) =>
            prev.map((m) => (m._id === matchId ? updatedMatch : m))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching match details:", error);
    }
  };

  const checkAttendanceStatus = async (matchId: string) => {
    try {
      const response = await matchAttendanceAPI.checkAttendanceStatus(matchId);
      if (response.success) {
        setAttendanceStatus(response.data.attendance);
      }
    } catch (error) {
      console.error("Error checking attendance status:", error);
      setAttendanceStatus(null);
    }
  };

  const handleRecordScore = async (team: 'A' | 'B', points: number = 1) => {
    if (!selectedMatch) return;

    try {
      setUpdating('score');
      const volunteerId = localStorage.getItem("userId");
      const teamId = team === 'A' ? selectedMatch.teamA._id : selectedMatch.teamB._id;

      await scoreAPI.recordScoreEvent(selectedMatch._id, {
        teamId,
        points,
        volunteerId: volunteerId || undefined
      });

      toast.success(`+${points} point(s) for ${team === 'A' ? selectedMatch.teamA.teamName : selectedMatch.teamB.teamName}`);
      await fetchMatchDetails(selectedMatch._id);
      await checkAttendanceStatus(selectedMatch._id);
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
      if (errorMessage.includes("Attendance must be completed")) {
        await checkAttendanceStatus(selectedMatch._id);
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateScore = async (team: 'A' | 'B', newScore: number) => {
    if (!selectedMatch) return;

    try {
      setUpdating('score');
      const volunteerId = localStorage.getItem("userId");
      const currentScore = selectedMatch.score || { teamA: 0, teamB: 0 };

      await scoreAPI.updateMatchScore(selectedMatch._id, {
        score: {
          teamA: team === 'A' ? newScore : currentScore.teamA,
          teamB: team === 'B' ? newScore : currentScore.teamB
        },
        volunteerId: volunteerId || undefined
      });

      toast.success("Score updated");
      await fetchMatchDetails(selectedMatch._id);
      await checkAttendanceStatus(selectedMatch._id);
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
      if (errorMessage.includes("Attendance must be completed")) {
        await checkAttendanceStatus(selectedMatch._id);
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleStatusChange = async (newStatus: 'scheduled' | 'ongoing' | 'completed') => {
    if (!selectedMatch) return;

    try {
      setUpdating('status');
      const volunteerId = localStorage.getItem("userId");

      await scoreAPI.updateMatchScore(selectedMatch._id, {
        status: newStatus,
        volunteerId: volunteerId || undefined
      });

      toast.success(`Match status updated to ${newStatus}`);
      await fetchMatchDetails(selectedMatch._id);
      await checkAttendanceStatus(selectedMatch._id);
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
      if (errorMessage.includes("Attendance must be completed")) {
        await checkAttendanceStatus(selectedMatch._id);
      }
    } finally {
      setUpdating(null);
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
  const scheduledMatches = matches.filter(m => m.status === 'scheduled');
  const ongoingMatches = matches.filter(m => m.status === 'ongoing');
  const completedMatches = matches.filter(m => m.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Live Scoring</h2>
          <p className="text-muted-foreground">Update scores and match status in real-time</p>
        </div>
        <Button onClick={fetchMatches} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {matches.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No matches available</h3>
          <p className="text-muted-foreground">
            You need to be assigned to a tournament to score matches.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matches List */}
          <div className="lg:col-span-1">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ongoing" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ongoing">Ongoing ({ongoingMatches.length})</TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled ({scheduledMatches.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedMatches.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="ongoing" className="space-y-2 mt-4">
                    {ongoingMatches.map((match) => (
                      <Card
                        key={match._id}
                        className={`cursor-pointer transition-all ${
                          selectedMatch?._id === match._id
                            ? 'border-2 border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedMatch(match)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{match.teamA.teamName}</span>
                              <span className="text-lg font-bold">{match.score?.teamA || 0}</span>
                            </div>
                            <div className="text-xs text-center text-muted-foreground">vs</div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{match.teamB.teamName}</span>
                              <span className="text-lg font-bold">{match.score?.teamB || 0}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                              {match.fieldName && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {match.fieldName}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(match.startTime)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {ongoingMatches.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No ongoing matches</p>
                    )}
                  </TabsContent>

                  <TabsContent value="scheduled" className="space-y-2 mt-4">
                    {scheduledMatches.map((match) => (
                      <Card
                        key={match._id}
                        className={`cursor-pointer transition-all ${
                          selectedMatch?._id === match._id
                            ? 'border-2 border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedMatch(match)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="font-semibold text-sm">{match.teamA.teamName} vs {match.teamB.teamName}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                        </CardContent>
                      </Card>
                    ))}
                    {scheduledMatches.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No scheduled matches</p>
                    )}
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-2 mt-4">
                    {completedMatches.map((match) => (
                      <Card
                        key={match._id}
                        className={`cursor-pointer transition-all ${
                          selectedMatch?._id === match._id
                            ? 'border-2 border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedMatch(match)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{match.teamA.teamName}</span>
                              <span className="text-lg font-bold">{match.score?.teamA || 0}</span>
                            </div>
                            <div className="text-xs text-center text-muted-foreground">vs</div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{match.teamB.teamName}</span>
                              <span className="text-lg font-bold">{match.score?.teamB || 0}</span>
                            </div>
                            {match.winnerTeamId && (
                              <div className="text-xs text-primary font-semibold text-center mt-1">
                                Winner: {match.winnerTeamId === match.teamA._id ? match.teamA.teamName : match.teamB.teamName}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {completedMatches.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No completed matches</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Scoring Interface */}
          <div className="lg:col-span-2">
            {selectedMatch ? (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Live Scoring</span>
                    <Select
                      value={selectedMatch.status}
                      onValueChange={(value: 'scheduled' | 'ongoing' | 'completed') =>
                        handleStatusChange(value)
                      }
                      disabled={updating === 'status'}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Match Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedMatch.fieldName || 'Field TBD'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDateTime(selectedMatch.startTime)}
                    </div>
                  </div>

                  {/* Attendance Warning */}
                  {attendanceStatus && !attendanceStatus.isComplete && selectedMatch.status === 'scheduled' && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-yellow-800 dark:text-yellow-200">
                            Attendance Required
                          </div>
                          <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            You must mark attendance for all players before starting the match or recording scores.
                            ({attendanceStatus.attendanceCount} of {attendanceStatus.totalPlayers} players marked - {attendanceStatus.percentage}%)
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-200 dark:hover:bg-yellow-900"
                            onClick={() => {
                              // Navigate to attendance tab (you can use a state management or router)
                              window.location.hash = '#attendance';
                              toast.info("Please mark attendance for all players in the Attendance tab");
                            }}
                          >
                            Go to Attendance Tab
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Score Display */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Team A */}
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold mb-2">{selectedMatch.teamA.teamName}</h3>
                        <div className="text-6xl font-bold text-primary">
                          {selectedMatch.score?.teamA || 0}
                        </div>
                      </div>

                      {/* Score Controls */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRecordScore('A', 1)}
                            disabled={updating === 'score' || selectedMatch.status === 'completed' || (attendanceStatus && !attendanceStatus.isComplete && selectedMatch.status === 'scheduled')}
                            className="flex-1"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            +1
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newScore = Math.max(0, (selectedMatch.score?.teamA || 0) - 1);
                              handleUpdateScore('A', newScore);
                            }}
                            disabled={updating === 'score' || selectedMatch.status === 'completed' || (attendanceStatus && !attendanceStatus.isComplete && selectedMatch.status === 'scheduled')}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          value={selectedMatch.score?.teamA || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value !== selectedMatch.score?.teamA) {
                              handleUpdateScore('A', value);
                            }
                          }}
                          disabled={updating === 'score' || selectedMatch.status === 'completed' || (attendanceStatus && !attendanceStatus.isComplete && selectedMatch.status === 'scheduled')}
                          className="text-center text-2xl font-bold"
                        />
                      </div>
                    </div>

                    {/* Team B */}
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold mb-2">{selectedMatch.teamB.teamName}</h3>
                        <div className="text-6xl font-bold text-primary">
                          {selectedMatch.score?.teamB || 0}
                        </div>
                      </div>

                      {/* Score Controls */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRecordScore('B', 1)}
                            disabled={updating === 'score' || selectedMatch.status === 'completed' || (attendanceStatus && !attendanceStatus.isComplete && selectedMatch.status === 'scheduled')}
                            className="flex-1"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            +1
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newScore = Math.max(0, (selectedMatch.score?.teamB || 0) - 1);
                              handleUpdateScore('B', newScore);
                            }}
                            disabled={updating === 'score' || selectedMatch.status === 'completed' || (attendanceStatus && !attendanceStatus.isComplete && selectedMatch.status === 'scheduled')}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          value={selectedMatch.score?.teamB || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value !== selectedMatch.score?.teamB) {
                              handleUpdateScore('B', value);
                            }
                          }}
                          disabled={updating === 'score' || selectedMatch.status === 'completed' || (attendanceStatus && !attendanceStatus.isComplete && selectedMatch.status === 'scheduled')}
                          className="text-center text-2xl font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    {selectedMatch.status === 'scheduled' && (
                      <Button
                        onClick={() => handleStatusChange('ongoing')}
                        disabled={updating === 'status' || (attendanceStatus && !attendanceStatus.isComplete)}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Match
                      </Button>
                    )}
                    {selectedMatch.status === 'ongoing' && (
                      <Button
                        onClick={() => handleStatusChange('completed')}
                        disabled={updating === 'status'}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete Match
                      </Button>
                    )}
                    {selectedMatch.status === 'completed' && (
                      <div className="flex flex-col md:flex-row gap-2 w-full">
                        <Link
                          to={`/volunteer/player-stats-entry?matchId=${selectedMatch._id}&teamId=${selectedMatch.teamA._id}`}
                          className="flex-1"
                        >
                          <Button variant="outline" className="w-full">Player's stat update - {selectedMatch.teamA.teamName}</Button>
                        </Link>
                        <Link
                          to={`/volunteer/player-stats-entry?matchId=${selectedMatch._id}&teamId=${selectedMatch.teamB._id}`}
                          className="flex-1"
                        >
                          <Button variant="outline" className="w-full">Player's stat update - {selectedMatch.teamB.teamName}</Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Live Indicator */}
                  {selectedMatch.status === 'ongoing' && (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-semibold">
                      <TrendingUp className="h-4 w-4 animate-pulse" />
                      Match in Progress - Updates auto-sync
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card p-12 text-center">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Match</h3>
                <p className="text-muted-foreground">
                  Choose a match from the list to start scoring
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScoringTab;

