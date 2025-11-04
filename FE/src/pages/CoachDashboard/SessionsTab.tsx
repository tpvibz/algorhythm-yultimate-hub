import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Users, Plus, CheckCircle, X, BarChart } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

interface Session {
  _id: string;
  title: string;
  type: "training" | "workshop";
  scheduledStart: string;
  scheduledEnd: string;
  venue?: string;
  assignedCoaches: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    uniqueUserId: string;
  }>;
  enrolledPlayers: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    uniqueUserId: string;
  }>;
  cohortId?: { _id: string; name: string };
  status: "scheduled" | "completed";
}

interface Player {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  uniqueUserId: string;
}

const SessionsTab = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlayers, setShowAddPlayers] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [addingPlayers, setAddingPlayers] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [visualizeOpen, setVisualizeOpen] = useState(false);

  useEffect(() => {
    // Get coach ID from localStorage (stored during login)
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setCoachId(storedUserId);
      fetchSessions(storedUserId);
    } else {
      toast.error("Coach ID not found. Please log in again.");
      setLoading(false);
    }
    fetchPlayers();
  }, []);

  const fetchSessions = async (coachId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:9000/api/sessions/coach/${coachId}`);
      const data = await response.json();
      if (response.ok) {
        setSessions(data);
      } else {
        toast.error(data.message || "Failed to load sessions");
      }
    } catch (error) {
      toast.error("Server error while loading sessions");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await fetch("http://localhost:9000/api/sessions/players/list");
      const data = await response.json();
      if (response.ok) {
        setPlayers(data);
      }
    } catch (error) {
      console.error("Failed to fetch players:", error);
    }
  };

  const handleAddPlayers = (sessionId: string) => {
    const session = sessions.find(s => s._id === sessionId);
    if (session) {
      // Start with empty selection - user can select new players to add
      setSelectedPlayerIds([]);
      setSelectedSessionId(sessionId);
      setShowAddPlayers(true);
    }
  };

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleConfirmAddPlayers = async () => {
    if (!selectedSessionId || selectedPlayerIds.length === 0) {
      toast.error("Please select at least one player");
      return;
    }

    try {
      setAddingPlayers(true);
      const response = await fetch(`http://localhost:9000/api/sessions/${selectedSessionId}/players`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: selectedPlayerIds }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Players added successfully!");
        setShowAddPlayers(false);
        setSelectedPlayerIds([]);
        setSelectedSessionId(null);
        // Refresh sessions
        if (coachId) {
          fetchSessions(coachId);
        }
      } else {
        toast.error(data.message || "Failed to add players");
      }
    } catch (error) {
      toast.error("Server error while adding players");
    } finally {
      setAddingPlayers(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card glass-hover animate-slide-up">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Sessions
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white transition-all"
              onClick={() => setVisualizeOpen(true)}
            >
              <BarChart className="h-4 w-4 mr-1" /> Visualize
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading sessions...</p>
          ) : sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className="p-4 rounded-lg bg-gradient-to-r from-orange-500/5 to-orange-600/5 hover:from-orange-500/10 hover:to-orange-600/10 transition-all border border-orange-500/10"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-lg">{session.title}</p>
                      <div className="text-sm text-muted-foreground space-y-1 mt-1">
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(session.scheduledStart)} - {formatTime(session.scheduledEnd)}
                        </p>
                        {session.venue && (
                          <p className="flex items-center gap-1">
                            📍 {session.venue}
                          </p>
                        )}
                        {session.cohortId && (
                          <p className="text-xs">Cohort: {session.cohortId.name}</p>
                        )}
                        {session.enrolledPlayers.length > 0 && (
                          <p className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {session.enrolledPlayers.length} player(s) enrolled
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          session.type === "workshop"
                            ? "bg-purple-600 text-white"
                            : "bg-orange-600 text-white"
                        }`}
                      >
                        {session.type}
                      </span>
                      <Button
                        onClick={() => handleAddPlayers(session._id)}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Players
                      </Button>
                    </div>
                  </div>
                  {session.enrolledPlayers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-orange-500/10">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Enrolled Players:</p>
                      <div className="flex flex-wrap gap-2">
                        {session.enrolledPlayers.map((player) => (
                          <span
                            key={player._id}
                            className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-600"
                          >
                            {player.firstName} {player.lastName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No sessions assigned to you</p>
          )}
        </CardContent>
      </Card>

      {/* Session Insights Dialog */}
      <Dialog open={visualizeOpen} onOpenChange={setVisualizeOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Session Insights</DialogTitle>
            <DialogDescription>Overview of your coaching sessions and player engagement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 animate-fade-in">
            {(() => {
              const totalSessions = sessions.length;
              const totalPlayers = sessions.reduce((sum, s) => sum + (s.enrolledPlayers?.length || 0), 0);
              const avgPlayers = totalSessions ? (totalPlayers / totalSessions).toFixed(1) : 0;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                  <Card className="bg-orange-500/10 border border-orange-500/20 text-center p-4">
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                    <p className="text-2xl font-semibold text-orange-600">{totalSessions}</p>
                  </Card>
                  <Card className="bg-orange-500/10 border border-orange-500/20 text-center p-4">
                    <p className="text-sm text-muted-foreground">Total Players Enrolled</p>
                    <p className="text-2xl font-semibold text-orange-600">{totalPlayers}</p>
                  </Card>
                  <Card className="bg-orange-500/10 border border-orange-500/20 text-center p-4">
                    <p className="text-sm text-muted-foreground">Avg Players / Session</p>
                    <p className="text-2xl font-semibold text-orange-600">{avgPlayers}</p>
                  </Card>
                </div>
              );
            })()}

            {/* Players per Session Bar Chart */}
            <div className="h-64 mb-2">
              <h3 className="text-sm font-medium mb-2">Players per Session</h3>
              {sessions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={sessions.map(s => ({ name: s.title, players: s.enrolledPlayers?.length || 0 }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} height={50} textAnchor="end" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="players" radius={[8,8,0,0]}>
                      {sessions.map((_, idx) => (
                        <Cell key={idx} fill="#f97316" />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </div>

            {/* Session Type Distribution Pie Chart */}
            <div className="h-64">
              <h3 className="text-sm font-medium mb-2">Session Type Distribution</h3>
              {sessions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Training", value: sessions.filter(s => s.type === "training").length },
                        { name: "Workshop", value: sessions.filter(s => s.type === "workshop").length },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {["#f97316", "#9333ea"].map((color, index) => (
                        <Cell key={index} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setVisualizeOpen(false)} variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Players Dialog */}
      <Dialog open={showAddPlayers} onOpenChange={setShowAddPlayers}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Players to Session</DialogTitle>
            <DialogDescription>
              Select players to add to this session. You can select multiple players.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {(() => {
              const currentSession = sessions.find(s => s._id === selectedSessionId);
              const enrolledPlayerIds = currentSession?.enrolledPlayers.map(p => p._id) || [];
              const availablePlayers = players.filter(p => !enrolledPlayerIds.includes(p._id));
              
              return availablePlayers.length > 0 ? (
                availablePlayers.map((player) => (
                  <label
                    key={player._id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedPlayerIds.includes(player._id)}
                      onCheckedChange={() => handlePlayerToggle(player._id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {player.firstName} {player.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {player.email} • {player.uniqueUserId}
                      </p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {players.length === 0 
                    ? "No players available" 
                    : "All available players are already enrolled in this session"}
                </p>
              );
            })()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddPlayers(false);
                setSelectedPlayerIds([]);
                setSelectedSessionId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAddPlayers}
              disabled={selectedPlayerIds.length === 0 || addingPlayers}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {addingPlayers ? "Adding..." : `Add ${selectedPlayerIds.length} Player(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionsTab;

