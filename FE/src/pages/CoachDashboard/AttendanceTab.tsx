import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/services/api";

interface Session {
  _id: string;
  title: string;
  type: "training" | "workshop";
  scheduledStart: string;
  scheduledEnd: string;
  venue?: string;
  enrolledPlayers: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    uniqueUserId: string;
  }>;
  status: "scheduled" | "completed";
}

interface AttendanceRecord {
  _id?: string;
  playerId: string;
  status: "present" | "absent" | "late";
}

const AttendanceTab = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<string, AttendanceRecord>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [coachId, setCoachId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setCoachId(storedUserId);
      fetchSessions(storedUserId);
    } else {
      toast.error("Coach ID not found. Please log in again.");
      setLoading(false);
    }
  }, []);

  const fetchSessions = async (coachId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/sessions/coach/${coachId}`);
      const data = await response.json();
      if (response.ok) {
        const sessionsData = Array.isArray(data) ? data : [];
        setSessions(sessionsData);
        
        // Initialize attendance records for all sessions
        const initialAttendance: Record<string, Record<string, AttendanceRecord>> = {};
        sessionsData.forEach((session: Session) => {
          initialAttendance[session._id] = {};
          session.enrolledPlayers.forEach((player) => {
            initialAttendance[session._id][player._id] = {
              playerId: player._id,
              status: "absent", // Default to absent
            };
          });
        });
        setAttendanceRecords(initialAttendance);

        // Fetch existing attendance records
        fetchExistingAttendance(sessionsData.map((s: Session) => s._id));
      } else {
        toast.error(data.message || "Failed to load sessions");
      }
    } catch (error) {
      toast.error("Server error while loading sessions");
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async (sessionIds: string[]) => {
    try {
      if (sessionIds.length === 0) return;

      const response = await fetch(
        `${API_BASE_URL}/attendance/sessions?sessionIds=${sessionIds.join(",")}`
      );
      if (response.ok) {
        const data = await response.json();
        // Update attendance records with existing data
        setAttendanceRecords((prev) => {
          const updated = { ...prev };
          if (Array.isArray(data)) {
            data.forEach((record: any) => {
              const sessionId = record.sessionId?._id || record.sessionId;
              const playerId = record.personId?._id || record.personId;
              if (sessionId && playerId && updated[sessionId]) {
                updated[sessionId][playerId] = {
                  _id: record._id,
                  playerId: playerId,
                  status: record.status || "absent",
                };
              }
            });
          }
          return updated;
        });
      }
    } catch (error) {
      console.error("Error fetching existing attendance:", error);
    }
  };

  const handleAttendanceChange = (sessionId: string, playerId: string, status: "present" | "absent" | "late") => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [playerId]: {
          ...prev[sessionId]?.[playerId],
          playerId,
          status,
        },
      },
    }));
  };

  const handleSaveAttendance = async (sessionId: string) => {
    if (!coachId) {
      toast.error("Coach ID not found");
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, [sessionId]: true }));
      
      const session = sessions.find((s) => s._id === sessionId);
      if (!session) {
        toast.error("Session not found");
        return;
      }

      const attendanceData = Object.values(attendanceRecords[sessionId] || {}).map((record) => ({
        sessionId,
        playerId: record.playerId,
        status: record.status,
        date: new Date(session.scheduledStart),
      }));

      const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          attendanceData,
          recordedBy: coachId,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Attendance saved successfully!");
      } else {
        toast.error(data.message || "Failed to save attendance");
      }
    } catch (error) {
      toast.error("Server error while saving attendance");
    } finally {
      setSaving((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusCounts = (sessionId: string) => {
    const records = attendanceRecords[sessionId] || {};
    const values = Object.values(records);
    return {
      present: values.filter((r) => r.status === "present").length,
      absent: values.filter((r) => r.status === "absent").length,
      late: values.filter((r) => r.status === "late").length,
      total: values.length,
    };
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card glass-hover animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mark Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading sessions...</p>
          ) : sessions.length > 0 ? (
            <div className="space-y-6">
              {sessions.map((session) => {
                const counts = getStatusCounts(session._id);
                const sessionAttendance = attendanceRecords[session._id] || {};

                return (
                  <div
                    key={session._id}
                    className="p-4 rounded-lg bg-gradient-to-r from-orange-500/5 to-orange-600/5 border border-orange-500/10"
                  >
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{session.title}</h3>
                          <div className="text-sm text-muted-foreground space-y-1 mt-1">
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(session.scheduledStart)} at {formatTime(session.scheduledStart)}
                            </p>
                            {session.venue && (
                              <p className="flex items-center gap-1">📍 {session.venue}</p>
                            )}
                            <p className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {session.enrolledPlayers.length} player(s) enrolled
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            session.type === "workshop"
                              ? "bg-purple-600 text-white"
                              : "bg-orange-600 text-white"
                          }`}
                        >
                          {session.type}
                        </span>
                      </div>

                      {/* Attendance Summary */}
                      {counts.total > 0 && (
                        <div className="flex gap-4 text-sm mt-3 pt-3 border-t border-orange-500/10">
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Present: {counts.present}</span>
                          </div>
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span>Absent: {counts.absent}</span>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Clock className="h-4 w-4" />
                            <span>Late: {counts.late}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Players List */}
                    {session.enrolledPlayers.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Mark Attendance for Players:
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                          {session.enrolledPlayers.map((player) => {
                            const currentStatus = sessionAttendance[player._id]?.status || "absent";

                            return (
                              <div
                                key={player._id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {player.firstName} {player.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {player.email} • {player.uniqueUserId}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant={currentStatus === "present" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleAttendanceChange(session._id, player._id, "present")}
                                    className={`${
                                      currentStatus === "present"
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : ""
                                    }`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Present
                                  </Button>
                                  <Button
                                    variant={currentStatus === "late" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleAttendanceChange(session._id, player._id, "late")}
                                    className={`${
                                      currentStatus === "late"
                                        ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                                        : ""
                                    }`}
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Late
                                  </Button>
                                  <Button
                                    variant={currentStatus === "absent" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleAttendanceChange(session._id, player._id, "absent")}
                                    className={`${
                                      currentStatus === "absent"
                                        ? "bg-red-600 hover:bg-red-700 text-white"
                                        : ""
                                    }`}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Absent
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No players enrolled in this session</p>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end pt-3 border-t border-orange-500/10">
                      <Button
                        onClick={() => handleSaveAttendance(session._id)}
                        disabled={saving[session._id] || session.enrolledPlayers.length === 0}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {saving[session._id] ? "Saving..." : "Save Attendance"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No sessions found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sessions with enrolled players will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceTab;

