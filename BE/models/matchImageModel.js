import mongoose from "mongoose";

const matchImageSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true
    },
    caption: {
      type: String,
      default: ""
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for efficient queries
matchImageSchema.index({ matchId: 1 });
matchImageSchema.index({ tournamentId: 1 });
matchImageSchema.index({ uploadedBy: 1 });

export default mongoose.model("MatchImage", matchImageSchema);

