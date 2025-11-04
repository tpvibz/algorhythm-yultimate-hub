import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Trophy, 
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  UserCheck,
  Save
} from "lucide-react";
import { scoreAPI, matchAttendanceAPI, Match, MatchPlayer, handleAPIError } from "@/services/api";

const MatchAttendanceTab = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [teamAPlayers, setTeamAPlayers] = useState<MatchPlayer[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<MatchPlayer[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playerAttendance, setPlayerAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      fetchMatchPlayers(selectedMatch._id);
      checkAttendanceStatus(selectedMatch._id);
    }
  }, [selectedMatch]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
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

  const fetchMatchPlayers = async (matchId: string) => {
    try {
      const response = await matchAttendanceAPI.getMatchPlayers(matchId);
      if (response.success) {
        setTeamAPlayers(response.data.teamAPlayers);
        setTeamBPlayers(response.data.teamBPlayers);
        
        // Initialize attendance state from existing records
        const attendanceMap: Record<string, 'present' | 'absent' | 'late'> = {};
        [...response.data.teamAPlayers, ...response.data.teamBPlayers].forEach(player => {
          if (player.attendance) {
            const playerId = player._id || player.playerId;
            if (playerId) {
              attendanceMap[playerId] = player.attendance.status;
            }
          }
        });
        setPlayerAttendance(attendanceMap);
      } else {
        toast.error(response.message || "Failed to load players");
      }
    } catch (error) {
      console.error("Error fetching match players:", error);
      toast.error(handleAPIError(error));
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
    }
  };

  const handleAttendanceChange = (playerId: string, status: 'present' | 'absent' | 'late') => {
    setPlayerAttendance(prev => ({
      ...prev,
      [playerId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedMatch) return;

    try {
      setSaving(true);
      const volunteerId = localStorage.getItem("userId");
      if (!volunteerId) {
        toast.error("User not logged in");
        return;
      }

      // Prepare attendance data
      const attendanceData: Array<{
        playerId: string;
        teamId: string;
        status: 'present' | 'absent' | 'late';
      }> = [];

      // Add team A players
      teamAPlayers.forEach(player => {
        const playerId = player._id || player.playerId;
        if (playerId && selectedMatch.teamA._id) {
          attendanceData.push({
            playerId,
            teamId: selectedMatch.teamA._id,
            status: playerAttendance[playerId] || 'absent'
          });
        }
      });

      // Add team B players
      teamBPlayers.forEach(player => {
        const playerId = player._id || player.playerId;
        if (playerId && selectedMatch.teamB._id) {
          attendanceData.push({
            playerId,
            teamId: selectedMatch.teamB._id,
            status: playerAttendance[playerId] || 'absent'
          });
        }
      });

      const response = await matchAttendanceAPI.markMatchAttendance(selectedMatch._id, {
        attendanceData,
        volunteerId
      });

      if (response.success) {
        toast.success(`Attendance saved for ${response.data.success} player(s)`);
        await fetchMatchPlayers(selectedMatch._id);
        await checkAttendanceStatus(selectedMatch._id);
        
        if (response.data.errors && response.data.errors.length > 0) {
          toast.warning(`${response.data.errors.length} player(s) failed to save`);
        }
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
      
      // Check if it's an attendance requirement error
      if (errorMessage.includes("Attendance must be completed")) {
        // This shouldn't happen here, but handle it gracefully
      }
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-yellow-500">Scheduled</Badge>;
      case "ongoing":
        return <Badge className="bg-blue-500">Ongoing</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getAttendanceIcon = (status: 'present' | 'absent' | 'late') => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "late":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const renderPlayerList = (players: MatchPlayer[], teamId: string, teamName: string) => {
    if (players.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No players found for {teamName}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {players.map((player) => {
          const playerId = player._id || player.playerId || '';
          const playerName = player.firstName && player.lastName
            ? `${player.firstName} ${player.lastName}`
            : player.name || 'Unknown Player';
          const currentStatus = playerAttendance[playerId] || player.attendance?.status || 'absent';

          return (
            <div
              key={playerId}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-1">
                  <div className="font-medium">{playerName}</div>
                  {player.jerseyNumber && (
                    <div className="text-sm text-muted-foreground">
                      #{player.jerseyNumber}
                    </div>
                  )}
                </div>
                {player.attendance && (
                  <div className="flex items-center gap-1">
                    {getAttendanceIcon(player.attendance.status)}
                    <span className="text-sm text-muted-foreground capitalize">
                      {player.attendance.status}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={currentStatus === 'present' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAttendanceChange(playerId, 'present')}
                  className={currentStatus === 'present' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Present
                </Button>
                <Button
                  variant={currentStatus === 'late' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAttendanceChange(playerId, 'late')}
                  className={currentStatus === 'late' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Late
                </Button>
                <Button
                  variant={currentStatus === 'absent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAttendanceChange(playerId, 'absent')}
                  className={currentStatus === 'absent' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Absent
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Matches List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Select Match
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading matches...</div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No matches available
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <Card
                  key={match._id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedMatch?._id === match._id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => setSelectedMatch(match)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-lg">
                        {match.teamA.teamName} vs {match.teamB.teamName}
                      </div>
                      {getStatusBadge(match.status)}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatTime(match.startTime)}
                      </div>
                      {match.fieldName && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {match.fieldName}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Form */}
      {selectedMatch && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Take Attendance - {selectedMatch.teamA.teamName} vs {selectedMatch.teamB.teamName}
              </CardTitle>
              {attendanceStatus && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={attendanceStatus.isComplete ? "default" : "secondary"}
                    className={attendanceStatus.isComplete ? "bg-green-500" : ""}
                  >
                    {attendanceStatus.percentage}% Complete
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Match Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Date & Time</div>
                <div className="font-medium">
                  {formatDate(selectedMatch.startTime)} at {formatTime(selectedMatch.startTime)}
                </div>
              </div>
              {selectedMatch.fieldName && (
                <div>
                  <div className="text-sm text-muted-foreground">Field</div>
                  <div className="font-medium">{selectedMatch.fieldName}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div>{getStatusBadge(selectedMatch.status)}</div>
              </div>
            </div>

            {/* Attendance Status Summary */}
            {attendanceStatus && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-sm text-muted-foreground">Present</div>
                  <div className="text-2xl font-bold text-green-600">
                    {attendanceStatus.presentCount}
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-sm text-muted-foreground">Late</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {attendanceStatus.lateCount}
                  </div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-sm text-muted-foreground">Absent</div>
                  <div className="text-2xl font-bold text-red-600">
                    {attendanceStatus.absentCount}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Players</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {attendanceStatus.totalPlayers}
                  </div>
                </div>
              </div>
            )}

            {/* Team A Players */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {selectedMatch.teamA.teamName}
              </h3>
              {renderPlayerList(teamAPlayers, selectedMatch.teamA._id, selectedMatch.teamA.teamName)}
            </div>

            {/* Team B Players */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {selectedMatch.teamB.teamName}
              </h3>
              {renderPlayerList(teamBPlayers, selectedMatch.teamB._id, selectedMatch.teamB.teamName)}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSaveAttendance}
                disabled={saving}
                size="lg"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>

            {/* Warning for incomplete attendance */}
            {attendanceStatus && !attendanceStatus.isComplete && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">
                      Attendance Incomplete
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      You must mark attendance for all players before starting the match or recording scores.
                      ({attendanceStatus.attendanceCount} of {attendanceStatus.totalPlayers} players marked)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchAttendanceTab;

