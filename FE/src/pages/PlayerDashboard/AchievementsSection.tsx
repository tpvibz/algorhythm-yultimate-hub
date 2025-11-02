import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Trophy, Star, TrendingUp, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";

interface AchievementsSectionProps {
  playerId: string;
  fullWidth?: boolean;
}

const AchievementsSection = ({ playerId, fullWidth }: AchievementsSectionProps) => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, [playerId]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/player/${playerId}/achievements`);
      if (response.ok) {
        const data = await response.json();
        setAchievements(data);
      } else {
        toast.error("Failed to load achievements");
      }
    } catch (error) {
      console.error("Error fetching achievements:", error);
      toast.error("Error loading achievements");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      trophy: Trophy,
      star: Star,
      "trending-up": TrendingUp,
      target: Target,
    };
    return icons[iconName] || Award;
  };

  if (loading) {
    return (
      <Card className={`glass-card ${fullWidth ? "" : ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {fullWidth ? "All Achievements" : "Recent Achievements"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const displayAchievements = fullWidth ? achievements : achievements.slice(0, 3);

  return (
    <Card className={`glass-card glass-hover ${fullWidth ? "" : ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          {fullWidth ? "All Achievements" : "Recent Achievements"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No achievements yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayAchievements.map((achievement) => {
              const Icon = getIcon(achievement.icon);
              return (
                <div
                  key={achievement._id}
                  className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-sm text-muted-foreground">{achievement.event}</p>
                    {achievement.date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(achievement.date), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementsSection;

