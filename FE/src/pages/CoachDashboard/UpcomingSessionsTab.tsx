import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users } from "lucide-react";
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
  }>;
  status: "scheduled" | "completed";
}

interface UpcomingSessionsTabProps {
  onViewSessions: () => void;
}

const UpcomingSessionsTab = ({ onViewSessions }: UpcomingSessionsTabProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
    // Refresh sessions every 5 seconds to catch updates
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const coachId = localStorage.getItem("userId");
      if (!coachId) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/sessions/coach/${coachId}`);
      const data = await response.json();
      if (response.ok) {
        setSessions(data);
      } else {
        console.error("Failed to load sessions:", data.message);
      }
    } catch (error) {
      console.error("Server error while loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffDays = Math.floor((sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays === 1) {
      return `Tomorrow, ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Filter upcoming sessions (scheduled status and future dates)
  const upcomingSessions = sessions
    .filter((session) => {
      const sessionDate = new Date(session.scheduledStart);
      return session.status === "scheduled" && sessionDate >= new Date();
    })
    .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
    .slice(0, 5); // Show only top 5 upcoming sessions

  return (
    <Card className="glass-card glass-hover animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading sessions...</p>
        ) : upcomingSessions.length > 0 ? (
          upcomingSessions.map((session) => (
            <div
              key={session._id}
              className="p-4 rounded-lg bg-gradient-to-r from-orange-500/5 to-orange-600/5 hover:from-orange-500/10 hover:to-orange-600/10 transition-all border border-orange-500/10"
              onClick={() => onViewSessions?.()}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-lg">{session.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDateTime(session.scheduledStart)}
                  </p>
                  {session.venue && (
                    <p className="text-sm text-muted-foreground">{session.venue}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-orange-600 text-white">
                    {session.type}
                  </span>
                  <span className="text-sm px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {session.enrolledPlayers.length} {session.enrolledPlayers.length === 1 ? 'player' : 'players'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming sessions</p>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingSessionsTab;

