import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, Users, Edit, ArrowRightLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import TransferRequestDialog from "./TransferRequestDialog";

interface PlayerProfileSectionProps {
  player: any;
  onRefresh: () => void;
}

const PlayerProfileSection = ({ player, onRefresh }: PlayerProfileSectionProps) => {
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getGenderLabel = (gender?: string) => {
    if (!gender) return "N/A";
    const labels: { [key: string]: string } = {
      male: "Male",
      female: "Female",
      other: "Other",
      "prefer-not-to-say": "Prefer not to say",
    };
    return labels[gender] || gender;
  };

  const transferStatus = player.transferRequest?.status;
  const hasPendingTransfer = transferStatus === "pending";

  return (
    <>
      <Card className="glass-card glass-hover animate-slide-up mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-2xl font-bold">
                  {getInitials(player.firstName, player.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowTransferDialog(true)}
                >
                  <ArrowRightLeft className="h-3 w-3 mr-1" />
                  {hasPendingTransfer ? "View Request" : "Request Transfer"}
                </Button>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {player.name}
                </h2>
                <p className="text-sm text-muted-foreground">ID: {player.uniqueUserId}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-purple-600" />
                    <span className="text-muted-foreground">Age:</span>
                    <span className="font-medium">{player.age || "N/A"} years</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Gender:</span>
                    <span className="font-medium">{getGenderLabel(player.gender)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-purple-600" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{player.email}</span>
                  </div>
                  {player.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-purple-600" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{player.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {player.affiliation && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-purple-600" />
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">
                          {player.affiliation.type === "school" ? "School" : "Community"}:
                        </span>
                        <span className="font-medium">
                          {player.affiliation.name} ({player.affiliation.location})
                        </span>
                      </div>
                    </div>
                  )}
                  {player.coach && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-purple-600" />
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Assigned Coach:</span>
                        <span className="font-medium">{player.coach.name}</span>
                      </div>
                    </div>
                  )}
                  {player.team && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-purple-600" />
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Team:</span>
                        <span className="font-medium">{player.team.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transfer Status Badge */}
              {hasPendingTransfer && (
                <div className="mt-4">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                    Transfer Request Pending: {player.transferRequest.from.name} → {player.transferRequest.to.name}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showTransferDialog && (
        <TransferRequestDialog
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
          player={player}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
};

export default PlayerProfileSection;

