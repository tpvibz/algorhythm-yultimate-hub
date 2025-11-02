import mongoose from "mongoose";

const matchPredictionSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: false // Allow anonymous predictions
    },
    predictedWinnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true
    },
    predictedScore: {
      teamA: Number,
      teamB: Number
    }
  },
  { timestamps: true }
);

// Create compound index to prevent duplicate predictions for logged-in users only
// Anonymous users can submit multiple predictions (tracked client-side via localStorage)
matchPredictionSchema.index({ matchId: 1, userId: 1 }, { 
  unique: true,
  sparse: true, // Sparse index to allow null userIds
  partialFilterExpression: { userId: { $exists: true } } // Only enforce uniqueness for logged-in users
});

// Index for efficient queries
matchPredictionSchema.index({ matchId: 1 });
matchPredictionSchema.index({ userId: 1 });

export default mongoose.model("MatchPrediction", matchPredictionSchema);

