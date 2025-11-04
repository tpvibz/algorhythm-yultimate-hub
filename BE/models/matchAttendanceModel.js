import mongoose from "mongoose";

const matchAttendanceSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true
    },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true
    },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      default: "absent"
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true
    },
    recordedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Ensure one attendance record per player per match
matchAttendanceSchema.index({ matchId: 1, playerId: 1 }, { unique: true });

// Index for efficient queries
matchAttendanceSchema.index({ matchId: 1 });
matchAttendanceSchema.index({ teamId: 1 });
matchAttendanceSchema.index({ recordedBy: 1 });

export default mongoose.model("MatchAttendance", matchAttendanceSchema);

