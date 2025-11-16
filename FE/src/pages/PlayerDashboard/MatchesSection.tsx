import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_BASE_URL } from "@/services/api";

interface MatchesSectionProps {
  playerId: string;
}

const MatchesSection = ({ playerId }: MatchesSectionProps) => {
  const [matches, setMatches] = useState<{ upcoming: any[]; past: any[] }>({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, [playerId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/player/${playerId}/matches`);
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      } else {
        toast.error("Failed to load matches");
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Error loading matches");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Matches
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const displayMatches = matches.upcoming.slice(0, 5);

  return (
    <Card className="glass-card glass-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Matches
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayMatches.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No upcoming matches scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayMatches.map((match) => (
              <div
                key={match._id}
                className="p-4 rounded-lg bg-gradient-to-r from-purple-500/5 to-purple-600/5 hover:from-purple-500/10 hover:to-purple-600/10 transition-all border border-purple-500/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-lg">vs {match.opponent}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(match.date), "MMM dd, yyyy 'at' h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{match.venue}</span>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-600">
                    {match.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchesSection;

