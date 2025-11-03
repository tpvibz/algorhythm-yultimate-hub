import mongoose from "mongoose";

const playerMatchStatsSchema = new mongoose.Schema(
  {
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: "Person", required: true },
    // Basic ratings for Ultimate (extendable)
    ratings: {
      overall: { type: Number, min: 1, max: 10, required: true },
      offense: { type: Number, min: 1, max: 10, default: 5 },
      defense: { type: Number, min: 1, max: 10, default: 5 },
      spirit: { type: Number, min: 1, max: 10, default: 5 },
      throws: { type: Number, min: 1, max: 10, default: 5 },
      cuts: { type: Number, min: 1, max: 10, default: 5 },
    },
    // Box score style stats
    points: { type: Number, min: 0, default: 0 },
    assists: { type: Number, min: 0, default: 0 },
    blocks: { type: Number, min: 0, default: 0 },
    remark: { type: String, maxlength: 500, default: "" },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Person", required: true }, // volunteer
  },
  { timestamps: true }
);

playerMatchStatsSchema.index({ matchId: 1, playerId: 1 }, { unique: true });
playerMatchStatsSchema.index({ teamId: 1, matchId: 1 });

const PlayerMatchStats = mongoose.model("PlayerMatchStats", playerMatchStatsSchema);
export default PlayerMatchStats;


