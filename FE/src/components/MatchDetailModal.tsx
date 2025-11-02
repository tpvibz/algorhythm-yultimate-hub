import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { X, Trophy, TrendingUp, Clock, MapPin, Users, BarChart3 } from "lucide-react";
import { Match, scoreAPI, predictionAPI, ScoreEvent, handleAPIError } from "@/services/api";

interface MatchDetailModalProps {
  match: Match | null;
  open: boolean;
  onClose: () => void;
}

const MatchDetailModal = ({ match, open, onClose }: MatchDetailModalProps) => {
  const [scoreEvents, setScoreEvents] = useState<ScoreEvent[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [userPrediction, setUserPrediction] = useState<any>(null);
  const [selectedWinner, setSelectedWinner] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && match) {
      fetchScoreEvents();
      fetchPredictions();
      fetchUserPrediction();
      
      // Poll for updates every 3 seconds
      const interval = setInterval(() => {
        fetchScoreEvents();
        fetchPredictions();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [open, match]);

  const fetchScoreEvents = async () => {
    if (!match) return;

    try {
      const response = await scoreAPI.getMatchScoreEvents(match._id);
      if (response.success) {
        setScoreEvents(response.data.scoreEvents);
      }
    } catch (error) {
      console.error("Error fetching score events:", error);
    }
  };

  const fetchPredictions = async () => {
    if (!match) return;

    try {
      const response = await predictionAPI.getMatchPredictions(match._id);
      if (response.success) {
        setPredictions(response.data);
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
    }
  };

  const fetchUserPrediction = async () => {
    if (!match) return;

    const userId = localStorage.getItem("userId");
    
    // Only fetch user prediction if logged in
    // Anonymous users in public poll don't have "their" prediction - it's a free poll
    if (userId) {
      try {
        const response = await predictionAPI.getUserPrediction(match._id, userId);
        if (response.success && response.data.prediction) {
          setUserPrediction(response.data.prediction);
          if (response.data.prediction) {
            setSelectedWinner(response.data.prediction.predictedWinner._id);
          }
        }
      } catch (error) {
        console.error("Error fetching user prediction:", error);
      }
    }
  };

  const handleSubmitPrediction = async () => {
    if (!match || !selectedWinner) {
      toast.error("Please select a team");
      return;
    }

    // Check if match has completed (allow predictions for scheduled and ongoing matches)
    if (match.status === 'completed') {
      toast.error("Cannot submit prediction for completed match");
      return;
    }

    try {
      setSubmitting(true);
      const userId = localStorage.getItem("userId");
      
      // Public poll: Allow anonymous users to vote freely (no restrictions)
      // Only logged-in users get one vote per match
      const response = await predictionAPI.submitPrediction(match._id, {
        predictedWinnerId: selectedWinner,
        userId: userId || undefined // undefined for anonymous = public poll vote
      });

      if (response.success) {
        toast.success(userId ? "Your vote has been recorded!" : "Thank you for voting! Your vote has been added to the poll.");
        await fetchPredictions();
        
        // For logged-in users, refresh their prediction
        if (userId) {
          await fetchUserPrediction();
        } else {
          // For anonymous users, show a friendly message
          setSelectedWinner(""); // Reset selection to allow another vote
        }
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  if (!match) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Match Details</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Info Header */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{match.teamA.teamName}</h3>
                  <div className="text-6xl font-bold text-primary">{match.score?.teamA || 0}</div>
                </div>
                <div className="text-4xl font-bold text-muted-foreground">VS</div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{match.teamB.teamName}</h3>
                  <div className="text-6xl font-bold text-primary">{match.score?.teamB || 0}</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                {match.fieldName && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {match.fieldName}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(match.startTime).toLocaleString()}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  match.status === 'ongoing' ? 'bg-green-500 text-white' :
                  match.status === 'completed' ? 'bg-blue-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {match.status}
                </div>
              </div>

              {match.status === 'ongoing' && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-600 font-semibold">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Live Now
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="predictions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="predictions">
                <Trophy className="h-4 w-4 mr-2" />
                Predictions ({predictions?.statistics?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Score Timeline ({scoreEvents.length})
              </TabsTrigger>
            </TabsList>

            {/* Predictions Tab */}
            <TabsContent value="predictions" className="space-y-4">
              {/* Prediction Form - Show for scheduled and ongoing matches */}
              {(match.status === 'scheduled' || match.status === 'ongoing') && (
                <Card className="glass-card border-2 border-primary/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Public Poll - Cast Your Vote
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {localStorage.getItem("userId") 
                        ? "You can vote once and update your vote anytime."
                        : "No login required! Vote freely and see the results update in real-time."}
                    </p>
                    {match.status === 'ongoing' && (
                      <p className="text-sm text-orange-500">
                        Match is in progress - vote now before it completes!
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedWinner(match.teamA._id)}
                        disabled={submitting}
                        className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedWinner === match.teamA._id
                            ? 'border-primary bg-primary/20 shadow-lg'
                            : 'border-border hover:border-primary/50 hover:bg-primary/5'
                        } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="font-bold text-xl mb-2">{match.teamA.teamName}</div>
                        <div className="text-sm text-muted-foreground">
                          Click to vote
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedWinner(match.teamB._id)}
                        disabled={submitting}
                        className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedWinner === match.teamB._id
                            ? 'border-primary bg-primary/20 shadow-lg'
                            : 'border-border hover:border-primary/50 hover:bg-primary/5'
                        } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="font-bold text-xl mb-2">{match.teamB.teamName}</div>
                        <div className="text-sm text-muted-foreground">
                          Click to vote
                        </div>
                      </button>
                    </div>
                    {selectedWinner && (
                      <Button
                        onClick={handleSubmitPrediction}
                        disabled={submitting}
                        size="lg"
                        className="w-full"
                      >
                        {submitting ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Submitting...
                          </>
                        ) : userPrediction ? (
                          "Update My Vote"
                        ) : (
                          "Vote Now ✋"
                        )}
                      </Button>
                    )}
                    {!selectedWinner && (
                      <p className="text-center text-sm text-muted-foreground">
                        👆 Click on a team above to cast your vote in the public poll
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Show message for completed matches */}
              {match.status === 'completed' && (
                <Card className="glass-card border border-border">
                  <CardContent className="p-6 text-center">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      This match has completed. Predictions are no longer accepted.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Your Prediction - Only show for logged-in users */}
              {userPrediction && localStorage.getItem("userId") && (
                <Card className="glass-card border-2 border-primary/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Your Vote</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        You voted for: {userPrediction.predictedWinner.teamName}
                      </span>
                      {userPrediction.predictedScore && (
                        <span className="text-sm text-muted-foreground">
                          {userPrediction.predictedScore.teamA} - {userPrediction.predictedScore.teamB}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      You can update your vote anytime before the match completes
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Prediction Statistics */}
              {predictions && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Live Poll Results
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Real-time results from public votes
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold">{predictions.match.teamA.teamName}</span>
                        <span>{predictions.statistics.teamA} votes ({predictions.statistics.teamAPercentage}%)</span>
                      </div>
                      <Progress value={predictions.statistics.teamAPercentage} className="h-3" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold">{predictions.match.teamB.teamName}</span>
                        <span>{predictions.statistics.teamB} votes ({predictions.statistics.teamBPercentage}%)</span>
                      </div>
                      <Progress value={predictions.statistics.teamBPercentage} className="h-3" />
                    </div>
                    <div className="text-center text-sm text-muted-foreground pt-2">
                      Total Predictions: {predictions.statistics.total}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Predictions List */}
              {predictions && predictions.predictions.length > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Recent Predictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {predictions.predictions.slice(0, 20).map((pred: any) => (
                        <div
                          key={pred._id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <Trophy className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm">
                                {pred.userId ? `${pred.userId.firstName} ${pred.userId.lastName}` : 'Anonymous'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Predicted: {pred.predictedWinner.teamName}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(pred.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Score Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              {scoreEvents.length === 0 ? (
                <Card className="glass-card p-12 text-center">
                  <p className="text-muted-foreground">No score events yet</p>
                </Card>
              ) : (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Score Events Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {scoreEvents.map((event, index) => (
                        <div
                          key={event._id}
                          className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border-l-4 border-primary"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">
                              {event.team.teamName} scored {event.points} point(s)
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(event.timestamp)}
                              {event.player && ` • ${event.player.firstName} ${event.player.lastName}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchDetailModal;

