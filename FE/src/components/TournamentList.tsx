import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// Tournament card list with backend-compatible fetch and fallback dummy data
const TournamentList = ({ onSelect, onClose, onRegister }) => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dummy data for display/fallback
  const dummy = [
    {
      id: 1,
      name: "City Cup",
      date: "2025-11-01",
      maxTeams: 16,
      format: "Knockout",
      description:
        "City Cup is a fast paced knockout tournament. Teams will play single elimination matches. Plenty of prizes for winners.",
      rules: "Match duration: 30 mins. Max roster: 12. Fair play mandatory.",
    },
    {
      id: 2,
      name: "Autumn League",
      date: "2025-11-05",
      maxTeams: 8,
      format: "Round Robin",
      description:
        "Autumn League features a friendly round-robin format to give teams more play time. Top 4 advance to semis.",
      rules: "Matches: 3 x 20 mins. Substitutions allowed. Teams must check-in 30 mins before match.",
    },
    {
      id: 3,
      name: "Winter Classic",
      date: "2025-10-28",
      maxTeams: 12,
      format: "Pools + Knockout",
      description: "A competitive event with pool stages followed by knockout rounds.",
      rules: "Pool games first. Tiebreakers by goal difference.",
    },
    {
      id: 4,
      name: "Spring Invitational",
      date: "2025-11-10",
      maxTeams: 24,
      format: "Groups + Knockout",
      description: "Invitational event for select teams.",
      rules: "Standard competition rules apply.",
    },
  ];

  useEffect(() => {
    let mounted = true;

    const fetchTournaments = async () => {
      setLoading(true);
      setError(null);
      try {
        // call the working API (user provided)
        const res = await fetch("http://localhost:9000/api/tournaments", { cache: "no-store" });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();

        // expected shape: { success: true, data: { tournaments: [...] } }
        const items = (json && json.data && json.data.tournaments) || [];
        if (mounted) setTournaments(items);
      } catch (err) {
        // fallback to dummy data
        if (mounted) {
          setError("Using local demo data");
          setTournaments(dummy);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTournaments();

    return () => {
      mounted = false;
    };
  }, []);

  const today = new Date();
  const upcoming = tournaments.filter((t) => {
    const dateVal = t.startDate || t.date || t.startDate;
    if (!dateVal) return false;
    const tDate = new Date(dateVal);
    return tDate.setHours(0, 0, 0, 0) >= new Date(today).setHours(0, 0, 0, 0);
  });

  return (
    <div className="w-96 max-w-[90vw] bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-xl overflow-hidden animate-slide-up p-3 z-50">
      <div className="flex items-center justify-between px-2 mb-2">
        <h4 className="text-sm font-semibold">Upcoming Tournaments</h4>
        <div className="flex items-center gap-2">
          {loading && <span className="text-xs text-muted-foreground">Loading...</span>}
          {error && <span className="text-xs text-muted-foreground">{error}</span>}
          <button className="text-xs text-muted-foreground" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {upcoming.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground px-2">No tournaments today or upcoming.</p>
        )}

        {upcoming.map((t) => (
          <div key={t._id || t.id} className="bg-background/60 p-3 rounded-lg border border-border flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h5 className="font-semibold">{t.name}</h5>
                <span className="text-xs text-muted-foreground">• {new Date(t.startDate || t.date).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Format: {t.format} • Max Teams: {t.maxTeams ?? t.availableSpots}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => onSelect(t)} className="rounded-full">
                View
              </Button>
              <Button size="sm" className="bg-orange-500 text-white rounded-full" onClick={() => onRegister && onRegister(t)}>
                Register Now
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentList;
