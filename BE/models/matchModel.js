import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
    fieldName: String,
    teamAId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    teamBId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    startTime: Date,
    endTime: Date,
    status: { type: String, enum: ["scheduled", "ongoing", "completed"], default: "scheduled" },
    score: { teamA: Number, teamB: Number },
    winnerTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    // Bracket fields
    round: { type: Number, default: 1 }, // Round number (1, 2, 3, etc.)
    roundName: { type: String }, // "Round 1", "Quarterfinals", "Semifinals", "Finals", etc.
    bracketPosition: { type: Number }, // Position in the bracket (for ordering)
    parentMatchAId: { type: mongoose.Schema.Types.ObjectId, ref: "Match" }, // Winner of this match advances
    parentMatchBId: { type: mongoose.Schema.Types.ObjectId, ref: "Match" }, // Winner of this match advances
    pool: { type: Number }, // For pool play formats
    matchNumber: { type: Number }, // Match number within round
  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);
