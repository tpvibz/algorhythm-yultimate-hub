import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface HomeVisitFormProps {
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const HomeVisitForm = ({ studentId, onClose, onSuccess }: HomeVisitFormProps) => {
  const [formData, setFormData] = useState({
    visitDate: "",
    notes: "",
    remarks: "",
    durationMinutes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const coachId = localStorage.getItem("userId");
      if (!coachId) {
        toast.error("Coach ID not found. Please log in again.");
        return;
      }

      if (!formData.visitDate) {
        toast.error("Visit date is required");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/students/${studentId}/home-visits`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitDate: formData.visitDate,
            notes: formData.notes,
            remarks: formData.remarks,
            durationMinutes: formData.durationMinutes
              ? parseInt(formData.durationMinutes)
              : null,
            coachId: coachId,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success("Home visit recorded successfully!");
        setFormData({
          visitDate: "",
          notes: "",
          remarks: "",
          durationMinutes: "",
        });
        onSuccess();
      } else {
        toast.error(data.message || "Failed to record home visit");
      }
    } catch (error) {
      toast.error("Error recording home visit");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Record Home Visit</span>
            <button onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visitDate">Visit Date</Label>
              <Input
                id="visitDate"
                type="date"
                value={formData.visitDate}
                onChange={(e) =>
                  setFormData({ ...formData, visitDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (minutes) - Optional</Label>
              <Input
                id="durationMinutes"
                type="number"
                min="1"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: e.target.value })
                }
                placeholder="e.g., 30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter visit notes and observations..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Enter additional remarks or recommendations..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Visit"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HomeVisitForm;

