import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, Star, Award, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  stats: {
    tournamentsPlayed: number;
    spiritScoreAvg: number;
    teamRank: number;
    achievementsCount: number;
    totalMatchesPlayed?: number;
    totalGoals?: number;
    totalAssists?: number;
    winRate?: number;
  };
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  const [displayedStats, setDisplayedStats] = useState({
    tournamentsPlayed: 0,
    spiritScoreAvg: 0,
    teamRank: 0,
    achievementsCount: 0,
    totalMatchesPlayed: 0,
    totalGoals: 0,
    totalAssists: 0,
    winRate: 0,
  });

  useEffect(() => {
    // Animate count-up effect
    const duration = 1000;
    const steps = 30;
    const stepDuration = duration / steps;

    const animateValue = (start: number, end: number, callback: (val: number) => void) => {
      const increment = (end - start) / steps;
      let current = start;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current += increment;
        if (step >= steps) {
          current = end;
          clearInterval(timer);
        }
        callback(Math.round(current * 10) / 10);
      }, stepDuration);
    };

    animateValue(0, stats.tournamentsPlayed, (val) => {
      setDisplayedStats((prev) => ({ ...prev, tournamentsPlayed: val }));
    });
    animateValue(0, stats.spiritScoreAvg, (val) => {
      setDisplayedStats((prev) => ({ ...prev, spiritScoreAvg: val }));
    });
    animateValue(0, stats.teamRank, (val) => {
      setDisplayedStats((prev) => ({ ...prev, teamRank: val }));
    });
    animateValue(0, stats.achievementsCount, (val) => {
      setDisplayedStats((prev) => ({ ...prev, achievementsCount: val }));
    });
    
    // Also animate secondary stats
    if (stats.totalMatchesPlayed) {
      setDisplayedStats((prev) => ({ ...prev, totalMatchesPlayed: stats.totalMatchesPlayed }));
    }
    if (stats.totalGoals) {
      setDisplayedStats((prev) => ({ ...prev, totalGoals: stats.totalGoals }));
    }
    if (stats.totalAssists) {
      setDisplayedStats((prev) => ({ ...prev, totalAssists: stats.totalAssists }));
    }
    if (stats.winRate) {
      setDisplayedStats((prev) => ({ ...prev, winRate: stats.winRate }));
    }
  }, [stats]);

  const statsConfig = [
    {
      icon: Trophy,
      label: "Tournaments Played",
      value: displayedStats.tournamentsPlayed,
      change: stats.totalMatchesPlayed ? `${stats.totalMatchesPlayed} matches` : "See details",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-600",
    },
    {
      icon: Target,
      label: "Spirit Score Avg",
      value: displayedStats.spiritScoreAvg.toFixed(1),
      change: stats.winRate ? `${stats.winRate}% win rate` : "Keep it up!",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-600",
    },
    {
      icon: Star,
      label: "Team Rank",
      value: displayedStats.teamRank > 0 ? `#${displayedStats.teamRank}` : "N/A",
      change: stats.totalGoals ? `${stats.totalGoals} goals` : "In division",
      iconColor: "text-green-600",
      bgColor: "bg-green-500/10",
      textColor: "text-green-600",
    },
    {
      icon: Award,
      label: "Achievements",
      value: displayedStats.achievementsCount,
      change: stats.totalAssists ? `${stats.totalAssists} assists` : "2 new!",
      iconColor: "text-orange-600",
      bgColor: "bg-orange-500/10",
      textColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsConfig.map((stat, index) => (
        <Card
          key={index}
          className="glass-card glass-hover hover:-translate-y-1 transition-all animate-slide-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <div className={`p-2 ${stat.bgColor} rounded-lg`}>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className={`text-sm ${stat.textColor} font-medium mt-1`}>{stat.change}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;

