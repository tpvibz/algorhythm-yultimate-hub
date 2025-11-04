import { useEffect, useMemo, useState } from "react";
import { feedbackAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type SpiritScoreItem = {
  type: 'given' | 'received';
  matchId: string;
  match?: any;
  opponentTeam?: { _id: string; teamName: string } | null;
  categories: { rulesKnowledge: number; foulsContact: number; fairMindedness: number; positiveAttitude: number; communication: number };
  total: number;
  comments: string;
  submittedAt: string;
};

const SpiritScoresTab = () => {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<SpiritScoreItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'given' | 'received'>('all');

  const coachId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    const load = async () => {
      if (!coachId) {
        toast.error('Coach not identified. Please login again.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await feedbackAPI.getCoachSpiritScores(coachId);
        setScores(res.data.scores);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load spirit scores');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [coachId]);

  const filtered = useMemo(() => {
    if (filterType === 'all') return scores;
    return scores.filter(s => s.type === filterType);
  }, [scores, filterType]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Spirit Scores Visibility</h2>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="given">Scores Given</SelectItem>
              <SelectItem value="received">Scores Received</SelectItem>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <Card key={`${item.type}-${item.matchId}-${item.submittedAt}`} className="bg-muted/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {item.type === 'given' ? 'Score Given' : 'Score Received'}
                  </CardTitle>
                  <Badge variant={item.type === 'given' ? 'default' : 'secondary'}>
                    {item.total}/20
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Match #{item.match?.matchNumber || 'N/A'} • {item.match?.roundName || 'Round'} • {item.match?.startTime ? new Date(item.match.startTime).toLocaleString() : 'N/A'}
                </div>
                <div className="text-sm">
                  Opponent: {item.opponentTeam?.teamName || 'Unknown'}
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>Rules: {item.categories.rulesKnowledge}/4</div>
                  <div>Fouls/Contact: {item.categories.foulsContact}/4</div>
                  <div>Fair-mindedness: {item.categories.fairMindedness}/4</div>
                  <div>Attitude: {item.categories.positiveAttitude}/4</div>
                  <div>Communication: {item.categories.communication}/4</div>
                </div>
                {item.comments && (
                  <div className="pt-2 text-muted-foreground">“{item.comments}”</div>
                )}
              </CardContent>
            </Card>
          ))}
          {!filtered.length && (
            <div className="text-sm text-muted-foreground">No spirit scores found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpiritScoresTab;


