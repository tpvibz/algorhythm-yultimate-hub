import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { playerStatsAPI, type PlayerMatchStatItem } from "@/services/api";

const CoachMatchPlayerStats = ({ matchId, teamId }: { matchId: string; teamId: string }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlayerMatchStatItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await playerStatsAPI.getTeamMatchPlayerStats(matchId, teamId);
        if (resp.success) setStats(resp.data.stats);
      } catch (e: any) {
        setError(e?.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [matchId, teamId]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <h1 className="text-3xl font-bold mb-6">Team Player Stats</h1>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No stats yet for this match.</p>
        ) : (
          <div className="grid gap-4">
            {stats.map((s) => (
              <Card key={s._id} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{(s.playerId as any)?.firstName} {(s.playerId as any)?.lastName}</p>
                  <span className="text-xs text-muted-foreground">Overall: {s.ratings.overall}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-3 text-center">
                  <div><div className="font-bold">{s.ratings.offense ?? 0}</div><div className="text-xs text-muted-foreground">Offense</div></div>
                  <div><div className="font-bold">{s.ratings.defense ?? 0}</div><div className="text-xs text-muted-foreground">Defense</div></div>
                  <div><div className="font-bold">{s.ratings.throws ?? 0}</div><div className="text-xs text-muted-foreground">Throws</div></div>
                  <div><div className="font-bold">{s.ratings.cuts ?? 0}</div><div className="text-xs text-muted-foreground">Cuts</div></div>
                  <div><div className="font-bold">{s.ratings.spirit ?? 0}</div><div className="text-xs text-muted-foreground">Spirit</div></div>
                  <div><div className="font-bold">{(s as any)?.ratings?.hustle ?? '-'}</div><div className="text-xs text-muted-foreground">&nbsp;</div></div>
                </div>
                {s.remark && <p className="mt-3 text-sm text-muted-foreground">Remark: {s.remark}</p>}
              </Card>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default CoachMatchPlayerStats;


