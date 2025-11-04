import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, Trophy, Target, TrendingUp, Calendar, CheckCircle, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Tournament, analyticsAPI, AdminOverviewResponse } from "@/services/api";

interface OverviewTabProps {
  setActiveTab: (tab: string) => void;
  tournaments?: Tournament[];
}

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
  cohortId?: { _id: string; name: string };
  status: "scheduled" | "completed";
}

const OverviewTab = ({ setActiveTab, tournaments = [] }: OverviewTabProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<AdminOverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Get tournament status helper
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

  useEffect(() => {
    fetchSessions();
    fetchAdminOverview();
  }, []);

  const fetchAdminOverview = async () => {
    try {
      setOverviewLoading(true);
      const response = await analyticsAPI.getAdminOverview();
      if (response.success) {
        setOverviewData(response);
      } else {
        toast.error("Failed to load admin overview");
      }
    } catch (error) {
      toast.error("Server error while loading admin overview");
      console.error("Error fetching admin overview:", error);
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch("http://localhost:9000/api/sessions");
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

  // Filter upcoming sessions (scheduled status and future dates)
  const upcomingSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.scheduledStart);
    return session.status === "scheduled" && sessionDate >= new Date();
  });

  // Use real data from backend or fallback to defaults
  const stats = overviewData ? [
    { icon: Users, label: "Total Players", value: overviewData.data.stats.totalPlayers.value, change: overviewData.data.stats.totalPlayers.change },
    { icon: Trophy, label: "Active Tournaments", value: overviewData.data.stats.activeTournaments.value, change: overviewData.data.stats.activeTournaments.change },
    { icon: Target, label: "Teams Registered", value: overviewData.data.stats.teamsRegistered.value, change: overviewData.data.stats.teamsRegistered.change },
    { icon: TrendingUp, label: "Avg Spirit Score", value: overviewData.data.stats.avgSpiritScore.value, change: overviewData.data.stats.avgSpiritScore.change },
    { icon: Calendar, label: "Sessions This Month", value: overviewData.data.stats.sessionsThisMonth.value, change: overviewData.data.stats.sessionsThisMonth.change },
    { icon: CheckCircle, label: "Attendance Rate", value: overviewData.data.stats.attendanceRate.value, change: overviewData.data.stats.attendanceRate.change },
  ] : [
    { icon: Users, label: "Total Players", value: "0", change: "0%" },
    { icon: Trophy, label: "Active Tournaments", value: "0", change: "0" },
    { icon: Target, label: "Teams Registered", value: "0", change: "0%" },
    { icon: TrendingUp, label: "Avg Spirit Score", value: "0.0", change: "0" },
    { icon: Calendar, label: "Sessions This Month", value: "0", change: "0%" },
    { icon: CheckCircle, label: "Attendance Rate", value: "0%", change: "0%" },
  ];

  return (
    <>
      {/* Stats Grid */}
      {overviewLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground h-4 w-24 bg-gray-200 rounded"></CardTitle>
                <div className="p-2 bg-gray-200 rounded-lg w-8 h-8"></div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold h-8 w-16 bg-gray-200 rounded"></div>
                  <div className="text-sm h-4 w-12 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="glass-card glass-hover hover:-translate-y-1 animate-slide-up glow-blue"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg">
                <stat.icon className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-blue-600 font-medium">{stat.change}</div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card glass-hover animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending Actions</span>
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Account Requests", count: overviewData?.data.pendingActions.accountRequests || 0, action: "Review", tab: "accounts" },
              { title: "Volunteer Applications", count: overviewData?.data.pendingActions.volunteerApplications || 0, action: "Review", tab: "volunteers" },
              { title: "Tournament Approvals", count: overviewData?.data.pendingActions.tournamentApprovals || 0, action: "Approve", tab: "tournaments" }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/5 to-orange-600/5 hover:from-orange-500/10 hover:to-orange-600/10 transition-all">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.count} pending</p>
                </div>
                <button 
                  onClick={() => setActiveTab(item.tab)}
                  className="text-sm px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {item.action}
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card glass-hover animate-slide-up">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <span className="text-2xl font-bold">{overviewData?.data.quickStats.activeUsers || 0}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${overviewData?.data.quickStats.activeUsers ? Math.min(100, (overviewData.data.quickStats.activeUsers / 1000) * 100) : 0}%` }}></div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-green-600/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Sessions Booked</span>
                <span className="text-2xl font-bold">{overviewData?.data.quickStats.sessionsBooked || "0/0"}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${overviewData?.data.quickStats.sessionsBookedPercentage || 0}%` }}></div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-600/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Tournament Capacity</span>
                <span className="text-2xl font-bold">{overviewData?.data.quickStats.tournamentCapacity || "0/0"}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${overviewData?.data.quickStats.tournamentCapacityPercentage || 0}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions Section */}
      <Card className="glass-card glass-hover animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Sessions
            </span>
            <button 
              onClick={() => setActiveTab("sessions")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading sessions...</p>
          ) : upcomingSessions.length > 0 ? (
            <div className="space-y-3">
              {upcomingSessions.slice(0, 5).map((session) => (
                <div
                  key={session._id}
                  className="p-4 rounded-lg bg-gradient-to-r from-blue-500/5 to-blue-600/5 hover:from-blue-500/10 hover:to-blue-600/10 transition-all border border-blue-500/10"
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
                        {session.assignedCoaches.length > 0 && (
                          <p>
                            Coach: {session.assignedCoaches
                              .map((c) => `${c.firstName} ${c.lastName}`)
                              .join(", ")}
                          </p>
                        )}
                        {session.cohortId && (
                          <p className="text-xs">Cohort: {session.cohortId.name}</p>
                        )}
                      </div>
                    </div>
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
                </div>
              ))}
              {upcomingSessions.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{upcomingSessions.length - 5} more sessions
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming sessions</p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default OverviewTab;

