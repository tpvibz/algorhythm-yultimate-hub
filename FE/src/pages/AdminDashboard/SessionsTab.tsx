import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Calendar } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/services/api";

interface Coach {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  uniqueUserId: string;
}

interface Cohort {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  capacity: number;
}

interface Session {
  _id: string;
  title: string;
  type: "training" | "workshop";
  scheduledStart: string;
  scheduledEnd: string;
  venue?: string;
  assignedCoaches: Coach[];
  cohortId?: { _id: string; name: string };
  status: "scheduled" | "completed";
}

const SessionsTab = () => {
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "training" as "training" | "workshop",
    cohortId: "",
    venue: "",
    scheduledStart: "",
    scheduledEnd: "",
    assignedCoaches: [] as string[],
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setSessionError(null);
      await Promise.all([
        fetchSessions(),
        fetchCoaches(),
        fetchCohorts(),
      ]);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setSessionError("Failed to load sessions data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to load sessions");
      }
      const data = await response.json();
      setSessions(data);
      setSessionError(null);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessionError(error instanceof Error ? error.message : "Server error while loading sessions");
      throw error;
    }
  };

  const fetchCoaches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/coaches/list`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to load coaches");
      }
      const data = await response.json();
      setCoaches(data);
    } catch (error) {
      console.error("Failed to fetch coaches:", error);
      // Don't throw - coaches are optional
    }
  };

  const fetchCohorts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/cohorts/list`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to load cohorts");
      }
      const data = await response.json();
      setCohorts(data);
    } catch (error) {
      console.error("Failed to fetch cohorts:", error);
      // Don't throw - cohorts are optional
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.scheduledStart || !formData.scheduledEnd) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Combine date and time for scheduledStart and scheduledEnd
    const startDateTime = new Date(formData.scheduledStart);
    const endDateTime = new Date(formData.scheduledEnd);

    if (endDateTime <= startDateTime) {
      toast.error("End date/time must be after start date/time");
      return;
    }

    try {
      const sessionPayload: any = {
        title: formData.title.trim(),
        type: formData.type,
        scheduledStart: startDateTime.toISOString(),
        scheduledEnd: endDateTime.toISOString(),
        assignedCoaches: formData.assignedCoaches,
      };

      // Only include cohortId if it's not empty
      if (formData.cohortId && typeof formData.cohortId === 'string' && formData.cohortId.trim() !== "") {
        sessionPayload.cohortId = formData.cohortId.trim();
      }

      // Only include venue if it's not empty
      if (formData.venue && formData.venue.trim() !== "") {
        sessionPayload.venue = formData.venue.trim();
      }

      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionPayload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Session created successfully!");
        setShowCreateSession(false);
        setFormData({
          title: "",
          type: "training",
          cohortId: "",
          venue: "",
          scheduledStart: "",
          scheduledEnd: "",
          assignedCoaches: [],
        });
        fetchSessions();
      } else {
        toast.error(data.message || data.error || "Failed to create session");
        console.error("Session creation error:", data);
      }
    } catch (error: any) {
      toast.error(error.message || "Server error while creating session");
      console.error("Session creation error:", error);
    }
  };

  const handleCoachToggle = (coachId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedCoaches: prev.assignedCoaches.includes(coachId)
        ? prev.assignedCoaches.filter((id) => id !== coachId)
        : [...prev.assignedCoaches, coachId],
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter upcoming sessions (scheduled status and future dates)
  const upcomingSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.scheduledStart);
    return session.status === "scheduled" && sessionDate >= new Date();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Coaching Sessions</h2>
        <button
          onClick={() => setShowCreateSession(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Session
        </button>
      </div>

      {showCreateSession && (
        <Card className="glass-card border-2 border-blue-500/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Create New Session</span>
              <button onClick={() => setShowCreateSession(false)}>
                <X className="h-5 w-5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Session Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border focus:border-blue-500 focus:outline-none"
                    placeholder="Enter session title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Session Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as "training" | "workshop" })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border focus:border-blue-500 focus:outline-none"
                    required
                  >
                    <option value="training">Training</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cohort (Optional)</label>
                  <select
                    value={formData.cohortId}
                    onChange={(e) => setFormData({ ...formData, cohortId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a cohort (optional)</option>
                    {cohorts.map((cohort) => (
                      <option key={cohort._id} value={cohort._id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Venue (Optional)</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border focus:border-blue-500 focus:outline-none"
                    placeholder="Enter venue name or address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledStart}
                    onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledEnd}
                    onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Assign Coaches (Optional)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 rounded-lg bg-muted border border-border">
                  {coaches.map((coach) => (
                    <label
                      key={coach._id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted/80 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.assignedCoaches.includes(coach._id)}
                        onChange={() => handleCoachToggle(coach._id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        {coach.firstName} {coach.lastName} ({coach.uniqueUserId})
                      </span>
                    </label>
                  ))}
                  {coaches.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">No coaches available</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Session
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateSession(false)}
                  className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Available Coaches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : coaches.length > 0 ? (
              coaches.map((coach) => {
                const coachSessionsCount = sessions.filter((session) =>
                  session.assignedCoaches.some((c) => c._id === coach._id)
                ).length;
                return (
                  <div key={coach._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">
                        {coach.firstName} {coach.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {coach.email} • {coachSessionsCount} sessions
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No coaches available</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : sessionError ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-red-500">{sessionError}</p>
                <button
                  onClick={() => loadInitialData()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Retry
                </button>
              </div>
            ) : upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <div
                  key={session._id}
                  className="p-3 rounded-lg bg-gradient-to-r from-blue-500/5 to-blue-600/5 hover:from-blue-500/10 hover:to-blue-600/10 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{session.title}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        session.type === "workshop"
                          ? "bg-purple-600 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {session.type}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {session.assignedCoaches.length > 0 && (
                      <p>
                        Coaches:{" "}
                        {session.assignedCoaches
                          .map((c) => `${c.firstName} ${c.lastName}`)
                          .join(", ")}
                      </p>
                    )}
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
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming sessions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SessionsTab;
