import mongoose from "mongoose";

const tournamentFeedbackSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
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
    matchesCompleted: [
      {
        matchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Match",
          required: true
        },
        spiritScoreSubmitted: {
          type: Boolean,
          default: false
        },
        playerFeedbackSubmitted: {
          type: Boolean,
          default: false
        }
      }
    ],
    allFeedbackComplete: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    }
  },
  { 
    timestamps: true 
  }
);

// Index for efficient queries
tournamentFeedbackSchema.index({ tournamentId: 1, coachId: 1 });
tournamentFeedbackSchema.index({ coachId: 1, allFeedbackComplete: 1 });

export default mongoose.model("TournamentFeedback", tournamentFeedbackSchema);

