import { useEffect, useState } from "react";
import { feedbackAPI, tournamentAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const SpiritLeaderboardTab = () => {
  const [tournaments, setTournaments] = useState<Array<{ _id: string; name: string }>>([]);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Array<{
    teamId: string;
    teamName: string;
    averageTotal: number;
    categoryAverages: { rulesKnowledge: number; foulsContact: number; fairMindedness: number; positiveAttitude: number; communication: number };
    submissionCount: number;
  }>>([]);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        // Fetch all tournaments (backend statuses are 'upcoming' | 'live' | 'completed' | 'cancelled')
        const res = await tournamentAPI.getAllTournaments();
        const items = res.data.tournaments || [];
        setTournaments(items.map(t => ({ _id: t._id, name: t.name })));
        if (items.length > 0) {
          setTournamentId(items[0]._id);
        } else {
          setTournamentId(null);
        }
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load tournaments');
      }
    };
    loadTournaments();
  }, []);

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!tournamentId) return;
      setLoading(true);
      try {
        const res = await feedbackAPI.getTournamentSpiritLeaderboard(tournamentId);
        setLeaderboard(res.data.leaderboard || []);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load spirit leaderboard');
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboard();
  }, [tournamentId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Spirit Leaderboard</h2>
        <div className="w-72">
          <Select value={tournamentId || undefined} onValueChange={(v) => setTournamentId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Tournament" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map(t => (
                <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((row, idx) => (
            <Card key={row.teamId} className="bg-muted/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">#{idx + 1} • {row.teamName}</CardTitle>
                  <div className="text-sm font-semibold">{row.averageTotal}/20</div>
                </div>
                <div className="text-xs text-muted-foreground">Submissions: {row.submissionCount}</div>
              </CardHeader>
              <CardContent className="text-sm grid grid-cols-2 md:grid-cols-3 gap-2">
                <div>Rules: {row.categoryAverages.rulesKnowledge.toFixed(2)}/4</div>
                <div>Fouls/Contact: {row.categoryAverages.foulsContact.toFixed(2)}/4</div>
                <div>Fair-mindedness: {row.categoryAverages.fairMindedness.toFixed(2)}/4</div>
                <div>Attitude: {row.categoryAverages.positiveAttitude.toFixed(2)}/4</div>
                <div>Communication: {row.categoryAverages.communication.toFixed(2)}/4</div>
              </CardContent>
            </Card>
          ))}
          {!leaderboard.length && (
            <div className="text-sm text-muted-foreground">No spirit submissions yet.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpiritLeaderboardTab;


