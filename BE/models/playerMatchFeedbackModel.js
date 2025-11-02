import mongoose from "mongoose";

const playerMatchFeedbackSchema = new mongoose.Schema(
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
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true
    },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true
    },
    score: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          // Validates format like "3/7", "5/10", etc.
          return /^\d+\/\d+$/.test(v);
        },
        message: 'Score must be in format "number/number" (e.g., "3/7")'
      }
    },
    feedback: {
      type: String,
      required: true,
      minlength: [20, "Feedback must be at least 20 characters"],
      maxlength: [500, "Feedback cannot exceed 500 characters"]
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true 
  }
);

// Ensure one feedback per player per match per coach
playerMatchFeedbackSchema.index({ matchId: 1, playerId: 1, coachId: 1 }, { unique: true });

// Index for efficient queries
playerMatchFeedbackSchema.index({ matchId: 1 });
playerMatchFeedbackSchema.index({ playerId: 1 });
playerMatchFeedbackSchema.index({ coachId: 1 });
playerMatchFeedbackSchema.index({ tournamentId: 1 });

export default mongoose.model("PlayerMatchFeedback", playerMatchFeedbackSchema);

