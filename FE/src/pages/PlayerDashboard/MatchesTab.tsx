import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { playerStatsAPI, type PlayerMatchStatItem } from "@/services/api";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

const MatchesTab = ({ playerId }: { playerId: string | null }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerMatchStatItem[]>([]);

  const safePlayerId = useMemo(() => playerId || localStorage.getItem("playerId") || localStorage.getItem("userId") || "", [playerId]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!safePlayerId) {
          setError("Player not identified. Please sign in as a player.");
          setStats([]);
          return;
        }
        const resp = await playerStatsAPI.getPlayerStats(safePlayerId);
        if (resp.success) setStats(resp.data.stats);
      } catch (e: any) {
        setError(e?.message || "Failed to load matches");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [safePlayerId]);

  const groupedByMatch = useMemo(() => {
    const map = new Map<string, PlayerMatchStatItem>();
    for (const s of stats) {
      const matchKey = (s.matchId as any)?._id || String(s.matchId);
      // Use first occurrence per match for list card; details come from full filter
      if (!map.has(matchKey)) map.set(matchKey, s);
    }
    return Array.from(map.entries()).map(([key, sample]) => ({ key, sample }));
  }, [stats]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (stats.length === 0) return <p className="text-sm text-muted-foreground">No participated matches yet.</p>;

  return (
    <div className="grid gap-4">
      {groupedByMatch.map(({ key, sample }) => {
        const t = sample.tournamentId as any;
        const team = sample.teamId as any;
        const match = sample.matchId as any;
        const thisMatchStats = stats.filter(s => ((s.matchId as any)?._id || String(s.matchId)) === key);
        const self = thisMatchStats.find(s => (((s.playerId as any)?._id || String(s.playerId)) === safePlayerId)) || thisMatchStats[0];
        return (
          <Card key={key} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{t?.name || "Tournament"}</div>
                <div className="text-xs text-muted-foreground">Match: {match?._id || key} • {new Date(match?.startTime || sample.createdAt).toLocaleString()} • Status: {match?.status || '-'}</div>
                <div className="text-xs text-muted-foreground">Team: {team?.teamName || ""}</div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Your stats</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Your Match Stats</DialogTitle>
                  </DialogHeader>
                  {self ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
                        <div><div className="text-2xl font-bold text-primary">{self.ratings.overall}</div><div className="text-xs text-muted-foreground">Overall</div></div>
                        <div><div className="text-2xl font-bold text-primary">{self.ratings.offense ?? 0}</div><div className="text-xs text-muted-foreground">Offense</div></div>
                        <div><div className="text-2xl font-bold text-primary">{self.ratings.defense ?? 0}</div><div className="text-xs text-muted-foreground">Defense</div></div>
                        <div><div className="text-2xl font-bold text-primary">{self.ratings.throws ?? 0}</div><div className="text-xs text-muted-foreground">Throws</div></div>
                        <div><div className="text-2xl font-bold text-primary">{self.ratings.cuts ?? 0}</div><div className="text-xs text-muted-foreground">Cuts</div></div>
                        <div><div className="text-2xl font-bold text-primary">{self.ratings.spirit ?? 0}</div><div className="text-xs text-muted-foreground">Spirit</div></div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div><div className="text-2xl font-bold">{self.points ?? 0}</div><div className="text-xs text-muted-foreground">Points</div></div>
                        <div><div className="text-2xl font-bold">{self.assists ?? 0}</div><div className="text-xs text-muted-foreground">Assists</div></div>
                        <div><div className="text-2xl font-bold">{self.blocks ?? 0}</div><div className="text-xs text-muted-foreground">Blocks</div></div>
                      </div>
                      {self.remark && <p className="text-sm text-muted-foreground">Remark: {self.remark}</p>}

                      {/* Performance Radar */}
                      <h3 className="text-sm font-medium mt-6 mb-2">Performance Radar</h3>
                      {(() => {
                        const radarData = [
                          { stat: "Offense", value: (self.ratings as any)?.offense || 0 },
                          { stat: "Defense", value: (self.ratings as any)?.defense || 0 },
                          { stat: "Throws", value: (self.ratings as any)?.throws || 0 },
                          { stat: "Cuts", value: (self.ratings as any)?.cuts || 0 },
                          { stat: "Spirit", value: (self.ratings as any)?.spirit || 0 },
                          { stat: "Overall", value: (self.ratings as any)?.overall || 0 },
                        ];
                        const allZero = radarData.every(d => (d.value || 0) === 0);
                        return allZero ? (
                          <div className="text-sm text-muted-foreground">No stats available for visualization.</div>
                        ) : (
                          <div className="h-64 rounded-lg bg-white/60 dark:bg-white/5 p-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart data={radarData} outerRadius="70%">
                                <PolarGrid />
                                <PolarAngleAxis dataKey="stat" tick={{ fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                                <ReTooltip />
                                <Radar name="Ratings" dataKey="value" stroke="#f97316" fill="rgba(249,115,22,0.3)" fillOpacity={1} animationDuration={700} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()}

                      {/* Match Summary */}
                      {/* <h3 className="text-sm font-medium mt-6 mb-2">Match Summary</h3>
                      {(() => {
                        const summaryData = [
                          { label: "Points", value: (self as any)?.points || 0 },
                          { label: "Assists", value: (self as any)?.assists || 0 },
                          { label: "Blocks", value: (self as any)?.blocks || 0 },
                        ];
                        const allZero = summaryData.every(d => (d.value || 0) === 0);
                        if (allZero) return <div className="text-sm text-muted-foreground">No stats available for visualization.</div>;
                        return (
                          <div className="h-48 rounded-lg bg-white/60 dark:bg-white/5 p-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={summaryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="barOrange" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#fb923c" stopOpacity={0.6} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[6,6,0,0]}>
                                  {summaryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`url(#barOrange)`} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()} */}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No stats recorded for you in this match yet.</p>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default MatchesTab;


