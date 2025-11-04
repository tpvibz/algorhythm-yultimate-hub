import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar, Target, Star, TrendingUp, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import PlayerAIChat from "@/components/PlayerAIChat";
import { playerStatsAPI } from "@/services/api";
import { handleAPIError } from "@/services/api";

const PlayerDashboard = () => {
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const stats = [
    { icon: Trophy, label: "Tournaments Played", value: "12", change: "+2 this month" },
    { icon: Target, label: "Spirit Score Avg", value: "15.8", change: "Top 10%" },
    { icon: Star, label: "Team Rank", value: "#3", change: "In division" },
    { icon: Award, label: "Achievements", value: "8", change: "2 new!" }
  ];

  useEffect(() => {
    fetchPlayerData();
  }, []);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const playerId = currentUser?.id || currentUser?._id;
      
      if (!playerId) {
        console.log('No player ID found');
        setLoading(false);
        return;
      }

      // Fetch player stats
      const statsResponse = await playerStatsAPI.getPlayerStats(playerId);
      if (statsResponse.success) {
        setPlayerStats(statsResponse.data.stats || []);
      }

      // Prepare recent matches data (mock data for now - can be enhanced with real API)
      const mockRecentMatches = [
        {
          id: '1',
          date: '2025-05-01',
          opponent: 'Thunder Hawks',
          result: 'Win 15-8',
          yourScore: '8',
          opponentScore: '15',
          fieldName: 'Field A'
        },
        {
          id: '2',
          date: '2025-04-28',
          opponent: 'Storm Riders',
          result: 'Loss 12-15',
          yourScore: '15',
          opponentScore: '12',
          fieldName: 'Central Park'
        },
        {
          id: '3',
          date: '2025-04-25',
          opponent: 'Sky Warriors',
          result: 'Win 17-13',
          yourScore: '17',
          opponentScore: '13',
          fieldName: 'Field B'
        }
      ];
      setRecentMatches(mockRecentMatches);

    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performanceGoals = [
    "Improve throw accuracy",
    "Better defensive positioning",
    "Increase game awareness",
    "Faster decision making"
  ];

  const currentChallenges = [
    "Handling pressure situations",
    "Long throws under wind",
    "Quick transitions",
    "Communication with teammates"
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4">
          <div className="container mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading your dashboard...</p>
              </div>
            </div>
          </div>
        </div>
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
                <p className="text-muted-foreground text-lg">
                  Track your games and achievements
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="glass-card glass-hover hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className="p-2 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg">
                    <stat.icon className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm text-purple-600 font-medium mt-1">{stat.change}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card glass-hover animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Matches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentMatches.map((match, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-purple-500/5 to-purple-600/5 hover:from-purple-500/10 hover:to-purple-600/10 transition-all border border-purple-500/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-lg">vs {match.opponent}</p>
                        <p className="text-sm text-muted-foreground mt-1">{match.date}</p>
                        <p className="text-sm text-muted-foreground">{match.fieldName}</p>
                        <p className="text-sm font-medium mt-1">{match.result}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        match.result.includes('Win') ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {match.result.includes('Win') ? 'Win' : 'Loss'}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card glass-hover animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "MVP Award", event: "Spring Tournament 2025", icon: Trophy },
                  { title: "Perfect Spirit Score", event: "League Match #12", icon: Star },
                  { title: "Most Improved Player", event: "Q1 Season Review", icon: TrendingUp }
                ].map((achievement, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                      <achievement.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{achievement.title}</p>
                      <p className="text-sm text-muted-foreground">{achievement.event}</p>
                    </div>
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <BottomNav />
      
      {/* AI Performance Coach */}
      <PlayerAIChat
        playerStats={playerStats}
        recentMatches={recentMatches}
        performanceGoals={performanceGoals}
        currentChallenges={currentChallenges}
      />
    </div>
  );
};

export default PlayerDashboard;
