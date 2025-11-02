import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AssignedPlayer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  uniqueUserId: string;
  affiliation?: {
    type: string;
    name: string;
    location: string;
  } | null;
}

const TeamRegisterForm = ({ open, onOpenChange, tournament }) => {
  const [teamName, setTeamName] = useState("");
  const [totalMembers, setTotalMembers] = useState(5);
  const [players, setPlayers] = useState([]);
  const [assignedPlayers, setAssignedPlayers] = useState<AssignedPlayer[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAssignedPlayers();
    }
  }, [open]);

  useEffect(() => {
    // initialize players array when totalMembers changes
    const arr = Array.from({ length: totalMembers }, (_, i) => players[i] || { playerId: "", name: "", email: "", uniqueUserId: "" });
    setPlayers(arr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalMembers]);

  useEffect(() => {
    if (!open) {
      // reset form on close
      setTeamName("");
      setTotalMembers(5);
      setPlayers([]);
      setContactPhone("");
      setContactEmail("");
      setNotes("");
    }
  }, [open]);

  const fetchAssignedPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const coachId = localStorage.getItem("userId");
      if (!coachId) {
        toast.error("Coach ID not found");
        return;
      }

      // Use new endpoint that includes affiliation
      const response = await fetch(`http://localhost:5000/api/institutions/coaches/${coachId}/players`);
      if (response.ok) {
        const data = await response.json();
        setAssignedPlayers(data);
      } else {
        // Fallback to old endpoint
        const fallbackResponse = await fetch(`http://localhost:5000/api/students/coach/${coachId}`);
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setAssignedPlayers(data);
        } else {
          const data = await fallbackResponse.json();
          toast.error(data.message || "Failed to load assigned players");
        }
      }
    } catch (error) {
      console.error("Error fetching assigned players:", error);
      toast.error("Error loading assigned players");
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handlePlayerSelect = (index, playerId: string) => {
    const selectedPlayer = assignedPlayers.find(p => p._id === playerId);
    if (selectedPlayer) {
      const copy = [...players];
      copy[index] = {
        playerId: selectedPlayer._id,
        name: `${selectedPlayer.firstName} ${selectedPlayer.lastName}`,
        email: selectedPlayer.email,
        uniqueUserId: selectedPlayer.uniqueUserId
      };
      setPlayers(copy);
    }
  };

  const handlePlayerChange = (index, key, value) => {
    const copy = [...players];
    copy[index] = { ...copy[index], [key]: value };
    setPlayers(copy);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that all selected players are assigned to coach
    const coachId = localStorage.getItem("userId");
    const assignedPlayerIds = assignedPlayers.map(p => p._id);
    const invalidPlayers = players.filter(p => p.playerId && !assignedPlayerIds.includes(p.playerId));
    
    if (invalidPlayers.length > 0) {
      toast.error("Please select only players assigned to you");
      return;
    }

    // Validate that all player slots are filled
    const emptyPlayers = players.filter(p => !p.playerId || !p.name);
    if (emptyPlayers.length > 0) {
      toast.error("Please fill all player slots");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        teamName,
        totalMembers,
        players: players.map(p => ({
          playerId: p.playerId,
          name: p.name,
          email: p.email,
          uniqueUserId: p.uniqueUserId
        })),
        tournamentId: tournament?.id || tournament?._id,
        contactPhone,
        contactEmail,
        notes,
        coachId,
      };

      const res = await fetch("http://localhost:5000/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Team registered successfully");
        onOpenChange(false);
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Register team error:", error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register Team {tournament ? `- ${tournament.name}` : ""}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Team Name</Label>
            <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
          </div>

          <div>
            <Label>Total Members</Label>
            <Input type="number" min={1} max={50} value={totalMembers} onChange={(e) => setTotalMembers(Number(e.target.value))} required />
          </div>

          <div className="space-y-2">
            <Label>Players (Select from your assigned students)</Label>
            {loadingPlayers ? (
              <p className="text-sm text-muted-foreground">Loading assigned players...</p>
            ) : assignedPlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assigned players available. Please contact admin to assign students.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                {players.map((p, idx) => {
                  // Find already selected players to exclude from dropdown
                  const selectedPlayerIds = players.map(pl => pl.playerId).filter(id => id);
                  const availablePlayers = assignedPlayers.filter(ap => 
                    !selectedPlayerIds.includes(ap._id) || ap._id === p.playerId
                  );

                  return (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                      <Select
                        value={p.playerId || ""}
                        onValueChange={(value) => handlePlayerSelect(idx, value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Player" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePlayers.map((player) => (
                            <SelectItem key={player._id} value={player._id}>
                              {player.firstName} {player.lastName}
                              {player.affiliation && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({player.affiliation.name}, {player.affiliation.location})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {p.playerId && (
                        <>
                          <Input 
                            placeholder="Name" 
                            value={p.name || ""} 
                            disabled
                            className="bg-muted"
                          />
                          <Input 
                            placeholder="Email" 
                            value={p.email || ""} 
                            disabled
                            className="bg-muted"
                          />
                        </>
                      )}
                      {!p.playerId && (
                        <>
                          <div className="md:col-span-2 text-xs text-muted-foreground">
                            Select a player to auto-fill details
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <Label>Contact Phone</Label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>

          <div>
            <Label>Contact Email</Label>
            <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>

          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter>
            <div className="w-full flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" className="bg-orange-500 text-white" disabled={loading}>{loading ? "Registering..." : "Submit"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamRegisterForm;
