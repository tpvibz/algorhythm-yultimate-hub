import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useMemo, useState } from "react";
import { playerStatsAPI, type PlayerMatchStatItem } from "@/services/api";
import { Button } from "@/components/ui/button";

const PlayerStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlayerMatchStatItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const playerId = useMemo(() => localStorage.getItem("playerId") || localStorage.getItem("userId") || "", []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!playerId) {
          setError("Player not identified. Please sign in as a player.");
          setStats([]);
          return;
        }
        const resp = await playerStatsAPI.getPlayerStats(playerId);
        if (resp.success) setStats(resp.data.stats);
      } catch (e: any) {
        setError(e?.message || "Failed to load player stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [playerId]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Player Stats</h1>
          <Button variant="outline" onClick={() => window.location.reload()} disabled={loading}>Refresh</Button>
        </div>
        {!loading && stats.length > 0 && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const totals = stats.reduce((acc, s) => {
                acc.points += s.points || 0;
                acc.assists += s.assists || 0;
                acc.blocks += s.blocks || 0;
                acc.matches += 1;
                return acc;
              }, { points: 0, assists: 0, blocks: 0, matches: 0 });
              return (
                <>
                  <Card className="glass-card p-4 text-center"><div className="text-xs text-muted-foreground">Matches</div><div className="text-2xl font-bold">{totals.matches}</div></Card>
                  <Card className="glass-card p-4 text-center"><div className="text-xs text-muted-foreground">Points</div><div className="text-2xl font-bold text-primary">{totals.points}</div></Card>
                  <Card className="glass-card p-4 text-center"><div className="text-xs text-muted-foreground">Assists</div><div className="text-2xl font-bold text-primary">{totals.assists}</div></Card>
                  <Card className="glass-card p-4 text-center"><div className="text-xs text-muted-foreground">Blocks</div><div className="text-2xl font-bold text-primary">{totals.blocks}</div></Card>
                </>
              );
            })()}
          </div>
        )}
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No stats available yet.</p>
        ) : (
          <div className="grid gap-6">
            {stats.map((s) => (
              <Card key={s._id} className="glass-card glass-hover p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>{(s?.tournamentId as any)?.name?.slice(0,2)?.toUpperCase() || "PS"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{(s.tournamentId as any)?.name || "Tournament"}</h3>
                    <p className="text-muted-foreground text-sm">Team: {(s.teamId as any)?.teamName || ""} • Match: {(s.matchId as any)?._id || (s.matchId as any)} • {new Date((s.matchId as any)?.startTime || s.createdAt).toLocaleString()} • Status: {(s.matchId as any)?.status || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{s.ratings.overall}</div>
                    <div className="text-xs text-muted-foreground">Overall</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{s.ratings.offense ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Offense</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{s.ratings.defense ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Defense</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{s.ratings.throws ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Throws</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{s.ratings.cuts ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Cuts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{s.ratings.spirit ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Spirit</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center mt-4">
                  <div>
                    <div className="text-2xl font-bold">{s.points ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{s.assists ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Assists</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{s.blocks ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Blocks</div>
                  </div>
                </div>
                {s.remark && <p className="mt-4 text-sm text-muted-foreground">Remark: {s.remark}</p>}
              </Card>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default PlayerStats;
