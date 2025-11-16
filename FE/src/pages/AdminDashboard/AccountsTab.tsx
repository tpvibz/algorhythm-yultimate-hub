import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check, X, User, Award, MapPin } from "lucide-react";
import { authAPI, API_BASE_URL } from "@/services/api";
import { toast } from "sonner";

interface AccountsTabProps {
  accountRequests: any[];
  handleApprove: (id: string | number, coachId?: string, role?: string) => void;
  handleReject: (id: string | number, role?: string) => void;
}

interface Coach {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  uniqueUserId: string;
}

const AccountsTab = ({ accountRequests, handleApprove, handleReject }: AccountsTabProps) => {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showCoachDialog, setShowCoachDialog] = useState(false);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<Coach[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  const fetchCoaches = async () => {
    try {
      setLoadingCoaches(true);
      const response = await authAPI.getActiveCoaches();
      setCoaches(response);

      // If player has affiliation, filter coaches by matching affiliation
      if (selectedRequest?.applicantInfo?.affiliation) {
        fetchCoachesByAffiliation(selectedRequest.applicantInfo.affiliation);
      } else {
        setFilteredCoaches(response);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch coaches");
    } finally {
      setLoadingCoaches(false);
    }
  };

  const fetchCoachesByAffiliation = async (affiliation: any) => {
    try {
      // Fetch coaches from institution
      const res = await fetch(
        `${API_BASE_URL}/institutions/${affiliation.id}/coaches`
      );
      if (res.ok) {
        const institutionCoaches = await res.json();
        setFilteredCoaches(institutionCoaches);
      } else {
        // Fallback to all coaches if institution endpoint fails
        setFilteredCoaches(coaches);
      }
    } catch {
      setFilteredCoaches(coaches);
    }
  };

  useEffect(() => {
    if (selectedRequest?.applicantInfo?.affiliation && coaches.length > 0) {
      fetchCoachesByAffiliation(selectedRequest.applicantInfo.affiliation);
    } else if (coaches.length > 0) {
      setFilteredCoaches(coaches);
    }
  }, [selectedRequest, coaches]);

  const handleApproveClick = (request: any) => {
    if (request.requestedRole === "player") {
      setSelectedRequest(request);
      setShowCoachDialog(true);
      fetchCoaches();
    } else {
      // For coach and volunteer, directly approve without coach selection
      handleApprove(request._id, undefined, request.requestedRole);
    }
  };

  const handleConfirmApprove = () => {
    if (selectedRequest) {
      if (selectedRequest.requestedRole === "player" && !selectedCoachId) {
        toast.error("Please select a coach");
        return;
      }
      handleApprove(selectedRequest._id, selectedCoachId || undefined, selectedRequest.requestedRole);
      setShowCoachDialog(false);
      setSelectedRequest(null);
      setSelectedCoachId("");
    }
  };

  const getExperienceLabel = (exp: string) => {
    const labels: { [key: string]: string } = {
      beginner: "Beginner (0-1 years)",
      intermediate: "Intermediate (1-3 years)",
      advanced: "Advanced (3-5 years)",
      expert: "Expert (5+ years)",
    };
    return labels[exp] || exp;
  };

  const getGenderLabel = (gender: string) => {
    const labels: { [key: string]: string } = {
      male: "Male",
      female: "Female",
      other: "Other",
      "prefer-not-to-say": "Prefer not to say",
    };
    return labels[gender] || gender;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Account Approval Requests</h2>
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="space-y-4">
            {accountRequests.map((request) => (
              <div
                key={request._id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold">
                      {request.applicantInfo?.firstName} {request.applicantInfo?.lastName}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-600">
                      {request.requestedRole || "player"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {request.applicantInfo?.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Applied: {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  
                  {/* Player-specific information */}
                  {request.requestedRole === "player" && (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap gap-3 text-xs">
                        {request.applicantInfo?.age && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Age: {request.applicantInfo.age}</span>
                          </div>
                        )}
                        {request.applicantInfo?.gender && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span>Gender: {getGenderLabel(request.applicantInfo.gender)}</span>
                          </div>
                        )}
                        {request.applicantInfo?.experience && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Award className="h-3 w-3" />
                            <span>Experience: {getExperienceLabel(request.applicantInfo.experience)}</span>
                          </div>
                        )}
                      </div>
                      {/* Affiliation information */}
                      {request.applicantInfo?.affiliation && (
                        <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-600 w-fit">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {request.applicantInfo.affiliation.type === "school" ? "School" : "Community"}:{" "}
                            {request.applicantInfo.affiliation.name} ({request.applicantInfo.affiliation.location})
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveClick(request)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request._id, request.requestedRole)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coach Assignment Dialog */}
      <Dialog open={showCoachDialog} onOpenChange={setShowCoachDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Coach to Player</DialogTitle>
            <DialogDescription>
              {selectedRequest?.applicantInfo?.affiliation ? (
                <>
                  Select a coach to assign to {selectedRequest?.applicantInfo?.firstName}{" "}
                  {selectedRequest?.applicantInfo?.lastName}. Coaches from the same{" "}
                  {selectedRequest.applicantInfo.affiliation.type} are shown first.
                </>
              ) : (
                <>
                  Select a coach to assign to {selectedRequest?.applicantInfo?.firstName}{" "}
                  {selectedRequest?.applicantInfo?.lastName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Coach</label>
              <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingCoaches ? "Loading coaches..." : "Choose a coach"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCoaches.length > 0 ? (
                    filteredCoaches.map((coach) => (
                      <SelectItem key={coach._id} value={coach._id}>
                        {coach.firstName} {coach.lastName} ({coach.uniqueUserId})
                      </SelectItem>
                    ))
                  ) : coaches.length > 0 ? (
                    coaches.map((coach) => (
                      <SelectItem key={coach._id} value={coach._id}>
                        {coach.firstName} {coach.lastName} ({coach.uniqueUserId})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No active coaches available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedRequest?.applicantInfo?.affiliation && filteredCoaches.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No coaches found for this {selectedRequest.applicantInfo.affiliation.type}. All coaches shown.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCoachDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmApprove} disabled={!selectedCoachId || loadingCoaches}>
              Approve & Assign Coach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountsTab;

