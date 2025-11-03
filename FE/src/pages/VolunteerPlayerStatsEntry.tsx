import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { matchAttendanceAPI, playerStatsAPI, type MatchPlayer } from "@/services/api";

interface EntryRow {
  playerId: string;
  teamId: string;
  name: string;
  ratings: { overall: number; offense?: number; defense?: number; spirit?: number; throws?: number; cuts?: number };
  remark?: string;
}

const VolunteerPlayerStatsEntry = ({ matchId: propMatchId }: { matchId?: string }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const matchId = propMatchId || params.get("matchId") || "";
  const filterTeamId = params.get("teamId") || "";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const volunteerId = useMemo(() => localStorage.getItem("userId") || "", []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await matchAttendanceAPI.getMatchPlayers(matchId);
        const teamAPlayers = resp.data.teamAPlayers || [];
        const teamBPlayers = resp.data.teamBPlayers || [];
        const mk = (p: MatchPlayer, teamKey: "teamA" | "teamB") => ({
          playerId: (p as any).playerId || (p as any)._id || "",
          teamId: (resp.data as any).match?.[teamKey === "teamA" ? "teamA" : "teamB"]?._id || (resp.data as any).team?._id || "",
          name: p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
          ratings: { overall: 5 },
          remark: "",
        });
        let rows: EntryRow[] = [
          ...teamAPlayers.map((p) => mk(p, "teamA")),
          ...teamBPlayers.map((p) => mk(p, "teamB")),
        ];
        if (filterTeamId) rows = rows.filter(r => r.teamId === filterTeamId);
        setRows(rows);
      } catch (e: any) {
        setError(e?.message || "Failed to load players for match");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [matchId]);

  const setVal = (idx: number, field: keyof EntryRow["ratings"] | "remark", val: string) => {
    setRows((prev) => {
      const next = [...prev];
      if (field === "remark") (next[idx].remark = val);
      else (next[idx].ratings as any)[field] = Number(val);
      return next;
    });
  };

  const onSave = async () => {
    try {
      setSaving(true);
      const payload = {
        volunteerId,
        stats: rows.map((r) => ({ playerId: r.playerId, teamId: r.teamId, ratings: r.ratings, remark: r.remark })),
      };
      const resp = filterTeamId
        ? await playerStatsAPI.submitTeamMatchPlayerStats(matchId, filterTeamId, payload as any)
        : await playerStatsAPI.submitMatchPlayerStats(matchId, payload);
      if (resp.success) {
        alert("Player stats submitted");
      }
    } catch (e: any) {
      alert(e?.message || "Failed to submit stats");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Enter Player Stats</h1>
          <Button onClick={onSave} disabled={saving || loading}>{saving ? "Saving…" : "Save Stats"}</Button>
        </div>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading players…</p>
        ) : (
          <div className="grid gap-4">
            {rows.map((r, idx) => (
              <Card key={`${r.playerId}-${idx}`} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{r.name || r.playerId}</p>
                    <p className="text-xs text-muted-foreground">Team: {r.teamId}</p>
                  </div>
                  <Button variant="outline" onClick={() => (document.getElementById(`edit-${idx}`) as HTMLDialogElement)?.showModal()}>Update</Button>
                </div>
                <dialog id={`edit-${idx}`} className="modal">
                  <form method="dialog" className="modal-box bg-background text-foreground p-6 rounded-lg w-full max-w-xl">
                    <h3 className="font-bold text-lg mb-4">Update Stats - {r.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      {["overall", "offense", "defense", "throws", "cuts", "spirit"].map((k) => (
                        <div key={k} className="space-y-1">
                          <label className="text-xs text-muted-foreground capitalize">{k}</label>
                          <Input type="number" min={1} max={10} value={(r.ratings as any)[k] ?? 5} onChange={(e) => setVal(idx, k as any, e.target.value)} />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {(["points", "assists", "blocks"] as const).map((k) => (
                        <div key={k} className="space-y-1">
                          <label className="text-xs text-muted-foreground capitalize">{k}</label>
                          <Input type="number" min={0} value={(r as any)[k] ?? 0} onChange={(e) => setRows(prev => { const n=[...prev]; (n[idx] as any)[k]=Number(e.target.value); return n; })} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <label className="text-xs text-muted-foreground">Remark</label>
                      <Input value={r.remark || ""} onChange={(e) => setVal(idx, "remark", e.target.value)} />
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                      <Button type="submit" variant="outline">Close</Button>
                    </div>
                  </form>
                </dialog>
              </Card>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default VolunteerPlayerStatsEntry;


