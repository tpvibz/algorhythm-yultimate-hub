import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Users, X, RefreshCw, Trash2 } from "lucide-react";
import { Tournament, volunteerAPI, Volunteer, handleAPIError } from "@/services/api";

interface AssignVolunteersModalProps {
  tournament: Tournament | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AssignVolunteersModal = ({ tournament, open, onClose, onSuccess }: AssignVolunteersModalProps) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [assignedVolunteers, setAssignedVolunteers] = useState<any[]>([]);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>([]);
  const [role, setRole] = useState<string>("General Support");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open && tournament) {
      fetchVolunteers();
      fetchTournamentVolunteers();
    }
  }, [open, tournament]);

  const fetchVolunteers = async () => {
    try {
      const response = await volunteerAPI.getAllVolunteers();
      if (response.success) {
        setVolunteers(response.data.volunteers);
      } else {
        toast.error(response.message || "Failed to load volunteers");
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    }
  };

  const fetchTournamentVolunteers = async () => {
    if (!tournament) return;

    try {
      const response = await volunteerAPI.getTournamentVolunteers(tournament._id);
      if (response.success) {
        setAssignedVolunteers(response.data.assignments);
      }
    } catch (error) {
      console.error("Error fetching tournament volunteers:", error);
    }
  };

  const handleToggleVolunteer = (volunteerId: string) => {
    setSelectedVolunteerIds((prev) =>
      prev.includes(volunteerId)
        ? prev.filter((id) => id !== volunteerId)
        : [...prev, volunteerId]
    );
  };

  const handleAssignVolunteers = async () => {
    if (!tournament || selectedVolunteerIds.length === 0) {
      toast.error("Please select at least one volunteer");
      return;
    }

    try {
      setAssigning(true);
      const response = await volunteerAPI.assignVolunteersToTournament(tournament._id, {
        volunteerIds: selectedVolunteerIds,
        role,
        notes
      });

      if (response.success) {
        toast.success(`Successfully assigned ${selectedVolunteerIds.length} volunteer(s)`);
        setSelectedVolunteerIds([]);
        setNotes("");
        await fetchTournamentVolunteers();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message || "Failed to assign volunteers");
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (volunteerId: string) => {
    if (!tournament) return;

    if (!window.confirm("Are you sure you want to unassign this volunteer?")) {
      return;
    }

    try {
      const response = await volunteerAPI.unassignVolunteerFromTournament(
        tournament._id,
        volunteerId
      );

      if (response.success) {
        toast.success("Volunteer unassigned successfully");
        await fetchTournamentVolunteers();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message || "Failed to unassign volunteer");
      }
    } catch (error) {
      toast.error(handleAPIError(error));
    }
  };

  if (!tournament) return null;

  const availableVolunteers = volunteers.filter(
    (v) => !assignedVolunteers.some((a) => a.volunteer._id === v._id)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Users className="h-6 w-6" />
            Assign Volunteers - {tournament.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Form */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Assign New Volunteers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Volunteers</Label>
                <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg p-4 space-y-2">
                  {availableVolunteers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No available volunteers (all are already assigned)
                    </p>
                  ) : (
                    availableVolunteers.map((volunteer) => (
                      <label
                        key={volunteer._id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedVolunteerIds.includes(volunteer._id)}
                          onCheckedChange={() => handleToggleVolunteer(volunteer._id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            {volunteer.firstName} {volunteer.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {volunteer.email} • {volunteer.uniqueUserId || "No ID"}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Score Keeper">Score Keeper</SelectItem>
                    <SelectItem value="Field Marshal">Field Marshal</SelectItem>
                    <SelectItem value="Medical Support">Medical Support</SelectItem>
                    <SelectItem value="General Support">General Support</SelectItem>
                    <SelectItem value="Photographer">Photographer</SelectItem>
                    <SelectItem value="Equipment Manager">Equipment Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the assignment..."
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleAssignVolunteers}
                disabled={assigning || selectedVolunteerIds.length === 0}
                className="w-full"
              >
                {assigning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Assign {selectedVolunteerIds.length} Volunteer(s)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Assigned Volunteers List */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Assigned Volunteers ({assignedVolunteers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {assignedVolunteers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No volunteers assigned yet
                </p>
              ) : (
                <div className="space-y-3">
                  {assignedVolunteers.map((assignment) => (
                    <div
                      key={assignment._id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="font-semibold">
                          {assignment.volunteer.firstName} {assignment.volunteer.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.volunteer.email} • Role: {assignment.role}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Status: <span className="font-medium">{assignment.status}</span>
                          {assignment.notes && ` • ${assignment.notes}`}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassign(assignment.volunteer._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Unassign
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignVolunteersModal;

