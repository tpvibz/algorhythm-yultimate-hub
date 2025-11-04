import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { feedbackAPI, PlayerForFeedback } from "@/services/api";
import { Loader2, CheckCircle2, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PlayerFeedbackFormProps {
  tournamentId?: string;
  matchId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PlayerFeedbackForm = ({ matchId, onSuccess, onCancel }: PlayerFeedbackFormProps) => {
  const [players, setPlayers] = useState<PlayerForFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerForFeedback | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const coachId = localStorage.getItem("userId");

  useEffect(() => {
    if (matchId && coachId) {
      loadPlayers();
    }
  }, [matchId, coachId]);

  const loadPlayers = async () => {
    if (!coachId) return;

    try {
      setLoading(true);
      const response = await feedbackAPI.getMatchPlayersForFeedback(matchId, coachId);
      if (response.success) {
        setPlayers(response.data.players);
      }
    } catch (error: any) {
      console.error("Error loading players:", error);
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  const handleGiveFeedbackClick = (player: PlayerForFeedback) => {
    setSelectedPlayer(player);
    if (player.feedback) {
      setScore(player.feedback.score);
      setFeedback(player.feedback.feedback);
    } else {
      setScore("");
      setFeedback("");
    }
    setFeedbackDialogOpen(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedPlayer || !coachId) return;

    // Validate score format (e.g., "3/7")
    if (!/^\d+\/\d+$/.test(score)) {
      toast.error('Score must be in format "number/number" (e.g., "3/7")');
      return;
    }

    // Validate feedback length
    if (feedback.length < 20) {
      toast.error("Feedback must be at least 20 characters");
      return;
    }

    if (feedback.length > 500) {
      toast.error("Feedback cannot exceed 500 characters");
      return;
    }

    setSubmitting(selectedPlayer.playerId);
    try {
      await feedbackAPI.submitPlayerFeedback(matchId, selectedPlayer.playerId, {
        score: score,
        feedback: feedback,
        coachId: coachId,
      });

      toast.success(`Feedback submitted for ${selectedPlayer.name}`);
      setFeedbackDialogOpen(false);
      setSelectedPlayer(null);
      setScore("");
      setFeedback("");
      await loadPlayers();
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast.error(error.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No players attended this match.</p>
      </div>
    );
  }

  const completedCount = players.filter((p) => p.feedbackSubmitted).length;
  const pendingCount = players.length - completedCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Players in Match</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {players.length} players have received feedback
          </p>
        </div>
        <Badge variant={pendingCount === 0 ? "default" : "secondary"}>
          {pendingCount} Pending
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
        {players.map((player) => (
          <Card
            key={player.playerId}
            className={`${
              player.feedbackSubmitted
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                : "bg-muted/30"
            }`}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{player.name}</p>
                    <p className="text-xs text-muted-foreground">{player.email}</p>
                  </div>
                </div>
                {player.feedbackSubmitted && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>
              {player.feedbackSubmitted && player.feedback ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Score: </span>
                    <span className="text-orange-600">{player.feedback.score}</span>
                  </div>
                  <div>
                    <span className="font-medium">Feedback: </span>
                    <p className="text-muted-foreground">{player.feedback.feedback}</p>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => handleGiveFeedbackClick(player)}
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                >
                  Give Feedback
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Close
        </Button>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPlayer?.feedbackSubmitted ? "Update" : "Give"} Feedback for{" "}
              {selectedPlayer?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="score">
                Player Score <span className="text-muted-foreground">(e.g., 3/7)</span>
              </Label>
              <Input
                id="score"
                placeholder="3/7"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                pattern="^\d+/\d+$"
              />
              <p className="text-xs text-muted-foreground">
                Format: number/number (e.g., 3 out of 7 would be "3/7")
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (2-3 lines, 20-500 characters)</Label>
              <Textarea
                id="feedback"
                placeholder="Enter detailed feedback about the player's performance..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                minLength={20}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {feedback.length}/500 characters (minimum 20)
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setFeedbackDialogOpen(false);
                  setSelectedPlayer(null);
                  setScore("");
                  setFeedback("");
                }}
                disabled={submitting === selectedPlayer?.playerId}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={submitting === selectedPlayer?.playerId}
              >
                {submitting === selectedPlayer?.playerId && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {selectedPlayer?.feedbackSubmitted ? "Update" : "Submit"} Feedback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerFeedbackForm;

