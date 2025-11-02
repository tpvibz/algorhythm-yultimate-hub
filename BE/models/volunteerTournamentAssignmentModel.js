import mongoose from "mongoose";

const volunteerTournamentAssignmentSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true
    },
    role: {
      type: String,
      enum: ["Score Keeper", "Field Marshal", "Medical Support", "General Support", "Photographer", "Equipment Manager"],
      default: "General Support"
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person"
    },
    status: {
      type: String,
      enum: ["assigned", "confirmed", "declined", "completed"],
      default: "assigned"
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

// Create compound index to prevent duplicate assignments
volunteerTournamentAssignmentSchema.index({ volunteerId: 1, tournamentId: 1 }, { unique: true });

// Index for efficient queries
volunteerTournamentAssignmentSchema.index({ volunteerId: 1 });
volunteerTournamentAssignmentSchema.index({ tournamentId: 1 });
volunteerTournamentAssignmentSchema.index({ status: 1 });

export default mongoose.model("VolunteerTournamentAssignment", volunteerTournamentAssignmentSchema);

