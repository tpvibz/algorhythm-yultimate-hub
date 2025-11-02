import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { RefreshCw, Clock, MapPin, Save, Play, CheckCircle2, Calendar } from "lucide-react";
import { scheduleAPI, Match, Tournament, handleAPIError } from "@/services/api";

interface MatchManagementModalProps {
  tournament: Tournament | null;
  open: boolean;
  onClose: () => void;
}

const MatchManagementModal = ({ tournament, open, onClose }: MatchManagementModalProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (open && tournament) {
      fetchMatches();
      // Start polling for real-time updates
      const interval = setInterval(() => {
        fetchMatches();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [open, tournament]);

  const fetchMatches = async () => {
    if (!tournament) return;

    try {
      const response = await scheduleAPI.getMatchesByTournament(tournament._id);
      if (response.success) {
        setMatches(response.data.matches);
      } else {
        toast.error(response.message || "Failed to load matches");
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  const updateMatch = async (matchId: string, updates: any) => {
    try {
      setUpdating(matchId);
      const response = await scheduleAPI.updateMatch(matchId, updates);
      if (response.success) {
        toast.success("Match updated successfully");
        await fetchMatches();
        setEditingMatch(null);
      } else {
        toast.error(response.message || "Failed to update match");
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setUpdating(null);
    }
  };

  const handleQuickStatusUpdate = async (match: Match, newStatus: 'scheduled' | 'ongoing' | 'completed') => {
    await updateMatch(match._id, { status: newStatus });
  };

  const handleScoreUpdate = async (match: Match, team: 'A' | 'B', value: number) => {
    const newScore = {
      teamA: team === 'A' ? value : (match.score?.teamA || 0),
      teamB: team === 'B' ? value : (match.score?.teamB || 0)
    };
    await updateMatch(match._id, { score: newScore });
  };

  const handleFieldUpdate = async (match: Match, fieldName: string) => {
    await updateMatch(match._id, { fieldName });
  };

  const handleTimeUpdate = async (match: Match, startTime: string, endTime: string) => {
    await updateMatch(match._id, { startTime, endTime });
  };

  // Group matches by field
  const matchesByField = matches.reduce((acc, match) => {
    const field = match.fieldName || 'Unassigned';
    if (!acc[field]) {
      acc[field] = [];
    }
    acc[field].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const fields = Object.keys(matchesByField).sort();
  const allMatches = matches;

  // Filter matches by status
  const scheduledMatches = allMatches.filter(m => m.status === 'scheduled');
  const ongoingMatches = allMatches.filter(m => m.status === 'ongoing');
  const completedMatches = allMatches.filter(m => m.status === 'completed');

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const MatchCard = ({ match }: { match: Match }) => {
    const isEditing = editingMatch?._id === match._id;
    const isUpdating = updating === match._id;

    return (
      <Card className={`glass-card border-2 ${
        match.status === 'ongoing' ? 'border-yellow-500/50 bg-yellow-500/5' :
        match.status === 'completed' ? 'border-green-500/50 bg-green-500/5' :
        'border-border'
      }`}>
        <CardContent className="p-4">
          {isEditing ? (
            <EditMatchForm 
              match={match} 
              onSave={(updates) => {
                updateMatch(match._id, updates);
              }}
              onCancel={() => setEditingMatch(null)}
              isUpdating={isUpdating}
            />
          ) : (
            <div className="space-y-3">
              {/* Teams and Score */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-bold text-lg ${
                      match.score && match.score.teamA > match.score.teamB ? 'text-green-600' : ''
                    }`}>
                      {match.teamA.teamName}
                    </span>
                    <span className="text-muted-foreground">vs</span>
                    <span className={`font-bold text-lg ${
                      match.score && match.score.teamB > match.score.teamA ? 'text-green-600' : ''
                    }`}>
                      {match.teamB.teamName}
                    </span>
                  </div>
                  {match.score && (
                    <div className="flex items-center gap-2 text-2xl font-bold">
                      <span>{match.score.teamA}</span>
                      <span className="text-muted-foreground">-</span>
                      <span>{match.score.teamB}</span>
                    </div>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  match.status === 'ongoing' ? 'bg-yellow-500 text-white' :
                  match.status === 'completed' ? 'bg-green-500 text-white' :
                  'bg-blue-500 text-white'
                }`}>
                  {match.status}
                </div>
              </div>

              {/* Match Info */}
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{match.fieldName || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(match.startTime)} - {formatTime(match.endTime)}</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDateTime(match.startTime)}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2 border-t border-border">
                {match.status === 'scheduled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickStatusUpdate(match, 'ongoing')}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Start Match
                  </Button>
                )}
                {match.status === 'ongoing' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickStatusUpdate(match, 'completed')}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingMatch(match)}
                      className="flex-1"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Edit Score
                    </Button>
                  </>
                )}
                {(match.status === 'scheduled' || match.status === 'ongoing') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingMatch(match)}
                    className="flex-1"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const EditMatchForm = ({ 
    match, 
    onSave, 
    onCancel,
    isUpdating 
  }: { 
    match: Match;
    onSave: (updates: any) => void;
    onCancel: () => void;
    isUpdating: boolean;
  }) => {
    const [formData, setFormData] = useState({
      fieldName: match.fieldName || '',
      startTime: new Date(match.startTime).toISOString().slice(0, 16),
      endTime: new Date(match.endTime).toISOString().slice(0, 16),
      status: match.status,
      scoreTeamA: match.score?.teamA || 0,
      scoreTeamB: match.score?.teamB || 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        fieldName: formData.fieldName,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        status: formData.status,
        score: {
          teamA: formData.scoreTeamA,
          teamB: formData.scoreTeamB
        }
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label>Field Name</Label>
          <Input
            value={formData.fieldName}
            onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
            placeholder="Field 1"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Start Time</Label>
            <Input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>
          <div>
            <Label>End Time</Label>
            <Input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: 'scheduled' | 'ongoing' | 'completed') =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>{match.teamA.teamName} Score</Label>
            <Input
              type="number"
              min="0"
              value={formData.scoreTeamA}
              onChange={(e) => setFormData({ ...formData, scoreTeamA: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>{match.teamB.teamName} Score</Label>
            <Input
              type="number"
              min="0"
              value={formData.scoreTeamB}
              onChange={(e) => setFormData({ ...formData, scoreTeamB: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isUpdating} className="flex-1">
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    );
  };

  if (!tournament) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Manage Matches - {tournament.name}</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMatches}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Matches ({allMatches.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({scheduledMatches.length})</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing ({ongoingMatches.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedMatches.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allMatches.length === 0 ? (
                <Card className="col-span-full p-8 text-center">
                  <p className="text-muted-foreground">No matches scheduled yet.</p>
                </Card>
              ) : (
                allMatches.map((match) => (
                  <MatchCard key={match._id} match={match} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledMatches.length === 0 ? (
                <Card className="col-span-full p-8 text-center">
                  <p className="text-muted-foreground">No scheduled matches.</p>
                </Card>
              ) : (
                scheduledMatches.map((match) => (
                  <MatchCard key={match._id} match={match} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="ongoing" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ongoingMatches.length === 0 ? (
                <Card className="col-span-full p-8 text-center">
                  <p className="text-muted-foreground">No ongoing matches.</p>
                </Card>
              ) : (
                ongoingMatches.map((match) => (
                  <MatchCard key={match._id} match={match} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedMatches.length === 0 ? (
                <Card className="col-span-full p-8 text-center">
                  <p className="text-muted-foreground">No completed matches.</p>
                </Card>
              ) : (
                completedMatches.map((match) => (
                  <MatchCard key={match._id} match={match} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Field-wise View */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Field-wise Schedule</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {fields.map((field) => (
              <Card key={field} className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {field}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {matchesByField[field].map((match) => (
                      <div
                        key={match._id}
                        className={`p-3 rounded-lg border ${
                          match.status === 'ongoing' ? 'border-yellow-500/50 bg-yellow-500/5' :
                          match.status === 'completed' ? 'border-green-500/50 bg-green-500/5' :
                          'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              {match.teamA.teamName} vs {match.teamB.teamName}
                            </div>
                            {match.score && (
                              <div className="text-lg font-bold">
                                {match.score.teamA} - {match.score.teamB}
                              </div>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            match.status === 'ongoing' ? 'bg-yellow-500 text-white' :
                            match.status === 'completed' ? 'bg-green-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            {match.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(match.startTime)} - {formatTime(match.endTime)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => setEditingMatch(match)}
                        >
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchManagementModal;

