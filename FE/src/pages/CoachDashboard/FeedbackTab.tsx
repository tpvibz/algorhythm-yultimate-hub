import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, AlertCircle, CheckCircle2, Clock, Calendar, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { feedbackAPI, MatchNeedingFeedback } from "@/services/api";
import SpiritScoreForm from "./SpiritScoreForm";
import PlayerFeedbackForm from "./PlayerFeedbackForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const FeedbackTab = () => {
  const [matches, setMatches] = useState<MatchNeedingFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [spiritScoreDialogOpen, setSpiritScoreDialogOpen] = useState(false);
  const [playerFeedbackDialogOpen, setPlayerFeedbackDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const coachId = localStorage.getItem("userId");

  useEffect(() => {
    if (coachId) {
      loadMatches();
    }
  }, [coachId]);

  const loadMatches = async () => {
    if (!coachId) return;
    
    try {
      setLoading(true);
      const response = await feedbackAPI.getMatchesNeedingFeedback(coachId);
      if (response.success) {
        setMatches(response.data.matches);
      }
    } catch (error: any) {
      console.error("Error loading matches:", error);
      toast.error("Failed to load matches needing feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleSpiritScoreClick = (matchId: string) => {
    setSelectedMatch(matchId);
    setSpiritScoreDialogOpen(true);
  };

  const handlePlayerFeedbackClick = (matchId: string) => {
    setSelectedMatch(matchId);
    setPlayerFeedbackDialogOpen(true);
  };

  const handleFeedbackSubmitted = async () => {
    setSpiritScoreDialogOpen(false);
    setPlayerFeedbackDialogOpen(false);
    setSelectedMatch(null);
    
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground text-center">
            You have no pending match feedback. All feedback has been submitted for your completed matches.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Post-Match Feedback</h2>
          <p className="text-muted-foreground">
            Submit feedback and spirit scores after each completed match. Registration for new tournaments is blocked until all match feedback is complete.
          </p>
        </div>
        <Button
          onClick={loadMatches}
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="flex items-center gap-2 text-orange-600 mb-4">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">
          {matches.length} {matches.length === 1 ? 'match' : 'matches'} requiring feedback
        </span>
      </div>

      {matches.map((match) => (
        <Card key={match.matchId} className="glass-card hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {match.tournament && (
                    <Trophy className="h-4 w-4 text-orange-600" />
                  )}
                  <CardTitle className="text-lg">
                    {match.roundName || `Match ${match.matchNumber || ""}`}
                  </CardTitle>
                </div>
                <CardDescription className="space-y-1 mt-2">
                  {match.tournament && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{match.tournament.name}</span>
                      <span className="text-muted-foreground">•</span>
                      <MapPin className="h-3 w-3" />
                      <span>{match.tournament.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span>{match.team.teamName} vs {match.opponentTeam?.teamName || "TBD"}</span>
                    </div>
                    {match.score && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-semibold">
                          {match.score.teamA} - {match.score.teamB}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(match.startTime).toLocaleString()}</span>
                    {match.fieldName && (
                      <>
                        <span>•</span>
                        <span>{match.fieldName}</span>
                      </>
                    )}
                  </div>
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                {!match.spiritScoreSubmitted && (
                  <Badge variant="destructive" className="w-fit">
                    <Clock className="h-3 w-3 mr-1" />
                    Spirit Score
                  </Badge>
                )}
                {!match.playerFeedbackSubmitted && (
                  <Badge variant="destructive" className="w-fit">
                    <Clock className="h-3 w-3 mr-1" />
                    Player Feedback
                  </Badge>
                )}
                {match.spiritScoreSubmitted && match.playerFeedbackSubmitted && (
                  <Badge variant="default" className="w-fit bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {match.spiritScoreSubmitted && match.playerFeedbackSubmitted ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>All feedback submitted for this match</span>
                </div>
              ) : (
                <>
                  {!match.spiritScoreSubmitted && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Spirit Score Required</p>
                          <p className="text-xs text-muted-foreground">
                            Rate the opponent team's spirit based on 5 categories
                          </p>
                        </div>
                        <Button
                          onClick={() => handleSpiritScoreClick(match.matchId)}
                          size="sm"
                          variant="outline"
                        >
                          Submit Spirit Score
                        </Button>
                      </div>
                    </div>
                  )}
                  {!match.playerFeedbackSubmitted && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Player Feedback Required</p>
                          <p className="text-xs text-muted-foreground">
                            {match.playersNeedingFeedback} of {match.totalPlayersAttended} players need feedback
                          </p>
                        </div>
                        <Button
                          onClick={() => handlePlayerFeedbackClick(match.matchId)}
                          size="sm"
                          variant="outline"
                        >
                          Submit Player Feedback
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Spirit Score Dialog */}
      <Dialog open={spiritScoreDialogOpen} onOpenChange={setSpiritScoreDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Spirit Score</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <SpiritScoreForm
              matchId={selectedMatch}
              onSuccess={handleFeedbackSubmitted}
              onCancel={() => {
                setSpiritScoreDialogOpen(false);
                setSelectedMatch(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Player Feedback Dialog */}
      <Dialog open={playerFeedbackDialogOpen} onOpenChange={setPlayerFeedbackDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Player Feedback</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <PlayerFeedbackForm
              matchId={selectedMatch}
              onSuccess={handleFeedbackSubmitted}
              onCancel={() => {
                setPlayerFeedbackDialogOpen(false);
                setSelectedMatch(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackTab;

