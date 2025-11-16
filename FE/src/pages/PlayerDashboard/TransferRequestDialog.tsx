import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/services/api";

interface TransferRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: any;
  onSuccess: () => void;
}

const TransferRequestDialog = ({ open, onOpenChange, player, onSuccess }: TransferRequestDialogProps) => {
  const [affiliationType, setAffiliationType] = useState<string>("");
  const [targetInstitutionId, setTargetInstitutionId] = useState<string>("");
  const [schools, setSchools] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);

  useEffect(() => {
    if (open) {
      fetchInstitutions();
      // Reset form
      setAffiliationType("");
      setTargetInstitutionId("");
    }
  }, [open]);

  const fetchInstitutions = async () => {
    try {
      setLoadingInstitutions(true);
      const [schoolsRes, communitiesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/institutions/schools`),
        fetch(`${API_BASE_URL}/institutions/communities`),
      ]);

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchools(schoolsData);
      }
      if (communitiesRes.ok) {
        const communitiesData = await communitiesRes.json();
        setCommunities(communitiesData);
      }
    } catch (error) {
      console.error("Error fetching institutions:", error);
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!affiliationType || !targetInstitutionId) {
      toast.error("Please select a target institution");
      return;
    }

    // Check if trying to transfer to same institution
    if (player.affiliation && player.affiliation.id === targetInstitutionId) {
      toast.error("You are already affiliated with this institution");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/player/${player._id}/transfer-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toInstitutionId: targetInstitutionId }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success("Transfer request submitted successfully!");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.message || "Failed to submit transfer request");
      }
    } catch (error) {
      console.error("Error submitting transfer request:", error);
      toast.error("Error submitting transfer request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Transfer</DialogTitle>
          <DialogDescription>
            Request to transfer from {player.affiliation?.name || "your current institution"} to another
            school or community.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="affiliationType">Transfer To</Label>
            <Select value={affiliationType} onValueChange={(value) => {
              setAffiliationType(value);
              setTargetInstitutionId("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select institution type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {affiliationType && (
            <div className="space-y-2">
              <Label htmlFor="targetInstitution">
                Select {affiliationType === "school" ? "School" : "Community"}
              </Label>
              {loadingInstitutions ? (
                <div className="text-sm text-muted-foreground py-2">Loading...</div>
              ) : (
                <Select value={targetInstitutionId} onValueChange={setTargetInstitutionId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select a ${affiliationType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(affiliationType === "school" ? schools : communities).map((institution) => (
                      <SelectItem key={institution._id} value={institution._id}>
                        {institution.name} ({institution.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !targetInstitutionId}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferRequestDialog;

