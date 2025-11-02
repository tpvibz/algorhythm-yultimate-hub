import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { feedbackAPI } from "@/services/api";
import { Loader2 } from "lucide-react";

interface SpiritScoreFormProps {
  tournamentId?: string;
  matchId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const SpiritScoreForm = ({ matchId, onSuccess, onCancel }: SpiritScoreFormProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState({
    rulesKnowledge: 5,
    foulsContact: 5,
    fairMindedness: 5,
    positiveAttitude: 5,
    communication: 5,
  });
  const [comments, setComments] = useState("");
  const coachId = localStorage.getItem("userId");

  const handleCategoryChange = (category: string, value: number[]) => {
    setCategories((prev) => ({
      ...prev,
      [category]: value[0],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!coachId) {
      toast.error("Coach ID not found");
      return;
    }

    // Validate all categories are set
    const allSet = Object.values(categories).every((val) => val >= 0 && val <= 10);
    if (!allSet) {
      toast.error("Please set all category scores");
      return;
    }

    setLoading(true);
    try {
      await feedbackAPI.submitSpiritScore(matchId, {
        categories: categories as any,
        comments: comments,
        coachId: coachId,
      });

      toast.success("Spirit score submitted successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting spirit score:", error);
      toast.error(error.response?.data?.message || "Failed to submit spirit score");
    } finally {
      setLoading(false);
    }
  };

  const categoryLabels: Record<string, { label: string; description: string }> = {
    rulesKnowledge: {
      label: "Rules Knowledge",
      description: "How well did the team know and follow the rules?",
    },
    foulsContact: {
      label: "Fouls & Contact",
      description: "How clean was the play? Were fouls called appropriately?",
    },
    fairMindedness: {
      label: "Fair-Mindedness",
      description: "Did the team make fair calls and accept calls gracefully?",
    },
    positiveAttitude: {
      label: "Positive Attitude",
      description: "Was the team respectful, encouraging, and sportsmanlike?",
    },
    communication: {
      label: "Communication",
      description: "How clear and respectful was communication on and off the field?",
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        {Object.entries(categories).map(([key, value]) => (
          <Card key={key} className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">
                {categoryLabels[key]?.label || key}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {categoryLabels[key]?.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Score: {value}/10</Label>
                <span className="text-xs text-muted-foreground">
                  {value === 0 && "Poor"}
                  {value > 0 && value < 3 && "Fair"}
                  {value >= 3 && value < 7 && "Good"}
                  {value >= 7 && value < 9 && "Very Good"}
                  {value >= 9 && "Excellent"}
                </span>
              </div>
              <Slider
                value={[value]}
                onValueChange={(val) => handleCategoryChange(key, val)}
                min={0}
                max={10}
                step={1}
                className="w-full"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments">Additional Comments (Optional)</Label>
        <Textarea
          id="comments"
          placeholder="Any additional comments about the opponent team's spirit..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {comments.length}/500 characters
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Spirit Score
        </Button>
      </div>
    </form>
  );
};

export default SpiritScoreForm;

