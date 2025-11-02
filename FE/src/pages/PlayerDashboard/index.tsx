import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import PlayerProfileSection from "./PlayerProfileSection";
import AttendanceSection from "./AttendanceSection";
import HomeVisitsSection from "./HomeVisitsSection";
import AchievementsSection from "./AchievementsSection";
import TransferSection from "./TransferSection";
import MatchesSection from "./MatchesSection";
import StatsCards from "./StatsCards";
import FeedbackSection from "./FeedbackSection";

const PlayerDashboard = () => {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setPlayerId(userId);
      fetchPlayerData(userId);
    } else {
      toast.error("Please log in to view your dashboard");
      setLoading(false);
    }
  }, []);

  const fetchPlayerData = async (id: string) => {
    try {
      setLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        fetch(`http://localhost:9000/api/player/${id}`),
        fetch(`http://localhost:9000/api/player/${id}/stats`),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setPlayerProfile(profileData.player);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
      toast.error("Failed to load player data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4 pb-32">
          <div className="container mx-auto">
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!playerId || !playerProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4 pb-32">
          <div className="container mx-auto">
            <Card className="glass-card p-12 text-center">
              <p className="text-muted-foreground">Unable to load player dashboard</p>
            </Card>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 px-4 pb-32">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8 space-y-2 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Player Dashboard</h1>
                <p className="text-muted-foreground text-lg">Track your games and achievements</p>
              </div>
            </div>
          </div>

          {/* Player Profile Section */}
          <PlayerProfileSection
            player={playerProfile}
            onRefresh={() => fetchPlayerData(playerId)}
          />

          {/* Stats Cards */}
          {stats && <StatsCards stats={stats} />}

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">📊 Attendance</TabsTrigger>
              <TabsTrigger value="home-visits">🏠 Home Visits</TabsTrigger>
              <TabsTrigger value="achievements">🏆 Achievements</TabsTrigger>
              <TabsTrigger value="feedback">💬 Feedback</TabsTrigger>
              <TabsTrigger value="transfers">🔁 Transfers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MatchesSection playerId={playerId} />
                <AchievementsSection playerId={playerId} />
              </div>
            </TabsContent>

            <TabsContent value="attendance">
              <AttendanceSection playerId={playerId} />
            </TabsContent>

            <TabsContent value="home-visits">
              <HomeVisitsSection playerId={playerId} />
            </TabsContent>

            <TabsContent value="achievements">
              <AchievementsSection playerId={playerId} fullWidth />
            </TabsContent>

            <TabsContent value="feedback">
              <FeedbackSection playerId={playerId} />
            </TabsContent>

            <TabsContent value="transfers">
              <TransferSection playerId={playerId} player={playerProfile} onRefresh={() => fetchPlayerData(playerId)} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PlayerDashboard;

