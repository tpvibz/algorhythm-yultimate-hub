import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CheckCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { analyticsAPI, CoachOverviewResponse } from "@/services/api";

const OverviewTab = () => {
  const [overviewData, setOverviewData] = useState<CoachOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoachOverview();
  }, []);

  const fetchCoachOverview = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getCoachOverview();
      if (response.success) {
        setOverviewData(response);
      } else {
        toast.error("Failed to load coach overview");
      }
    } catch (error) {
      toast.error("Server error while loading coach overview");
      console.error("Error fetching coach overview:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use real data from backend or fallback to defaults
  const stats = overviewData ? [
    { icon: Users, label: "Active Students", value: overviewData.data.stats.activeStudents.value, change: overviewData.data.stats.activeStudents.change },
    { icon: Calendar, label: "Sessions This Week", value: overviewData.data.stats.sessionsThisWeek.value, change: overviewData.data.stats.sessionsThisWeek.change },
    { icon: CheckCircle, label: "Attendance Rate", value: overviewData.data.stats.attendanceRate.value, change: overviewData.data.stats.attendanceRate.change },
    { icon: TrendingUp, label: "Avg Progress Score", value: overviewData.data.stats.avgProgressScore.value, change: overviewData.data.stats.avgProgressScore.change }
  ] : [
    { icon: Users, label: "Active Students", value: "0", change: "0" },
    { icon: Calendar, label: "Sessions This Week", value: "0", change: "0 upcoming" },
    { icon: CheckCircle, label: "Attendance Rate", value: "0%", change: "0%" },
    { icon: TrendingUp, label: "Avg Progress Score", value: "0.0", change: "0" }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="glass-card glass-hover hover:-translate-y-1 animate-slide-up glow-orange"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="p-2 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-lg">
                <stat.icon className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-orange-600 font-medium">{stat.change}</div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}
    </div>
  );
};

export default OverviewTab;

