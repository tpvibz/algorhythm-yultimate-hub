import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Calendar, Trophy, User, Star } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/services/api";

interface Feedback {
  _id: string;
  coach: {
    _id: string;
    name: string;
  } | null;
  score: string | null;
  feedback: string;
  date: string;
  match?: {
    _id: string;
    roundName?: string;
    matchNumber?: number;
    startTime: string;
  } | null;
  tournament?: {
    _id: string;
    name: string;
    location: string;
    startDate: string;
    endDate: string;
  } | null;
  team?: {
    _id: string;
    teamName: string;
  } | null;
  source: "match" | "profile";
}

interface FeedbackSectionProps {
  playerId: string;
}

const FeedbackSection = ({ playerId }: FeedbackSectionProps) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedback();
  }, [playerId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/player/${playerId}/feedback`);
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      }
    } catch (error) {
      console.error("Error loading feedback:", error);
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            You haven't received any feedback yet. Feedback from your coach will appear here after matches.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.map((fb) => (
        <Card key={fb._id} className="glass-card hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {fb.coach ? `Feedback from ${fb.coach.name}` : "Coach Feedback"}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(fb.date).toLocaleDateString()}</span>
                    {fb.score && (
                      <>
                        <span>•</span>
                        <Badge variant="secondary" className="text-xs">
                          Score: {fb.score}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {fb.tournament && (
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-orange-600" />
                <span className="font-medium">{fb.tournament.name}</span>
                {fb.match && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {fb.match.roundName || `Match ${fb.match.matchNumber || ""}`}
                    </span>
                  </>
                )}
              </div>
            )}
            {fb.team && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Team: {fb.team.teamName}</span>
              </div>
            )}
            <div className="pt-2 border-t">
              <p className="text-sm leading-relaxed">{fb.feedback}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FeedbackSection;

