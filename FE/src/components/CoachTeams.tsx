import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/services/api";

const CoachTeams = ({ open, onOpenChange }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const fetchTeams = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const coachId = localStorage.getItem("userId");

        // Prefer protected endpoint but allow coachId query as fallback
        const url = coachId
          ? `${API_BASE_URL}/teams/mine?coachId=${encodeURIComponent(coachId)}`
          : `${API_BASE_URL}/teams/mine`;

        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (mounted) setTeams(data || []);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Failed to load teams");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTeams();
    return () => { mounted = false; };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your Teams</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-3 max-h-64 overflow-y-auto">
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!loading && teams.length === 0 && <p className="text-sm text-muted-foreground">No teams found.</p>}

          {teams.map((team) => (
            <div key={team._id} className="p-3 rounded-lg bg-background/60 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{team.teamName}</div>
                  <div className="text-sm text-muted-foreground">Members: {team.totalMembers} • Registered: {new Date(team.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-sm text-muted-foreground">{team.tournamentId ? `Tournament: ${team.tournamentId}` : "No tournament"}</div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <div className="w-full flex justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoachTeams;
