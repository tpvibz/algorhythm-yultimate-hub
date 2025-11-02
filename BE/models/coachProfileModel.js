import mongoose from "mongoose";

const coachProfileSchema = new mongoose.Schema(
  {
    personId: { type: mongoose.Schema.Types.ObjectId, ref: "Person", unique: true },
    experienceYears: Number,
    certifications: [String],
    // Affiliation information
    affiliation: {
      type: {
        type: String,
        enum: ["school", "community"],
      },
      id: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
      name: String,
      location: String,
    },
    totalSessionsConducted: { type: Number, default: 0 },
    averageFeedbackScore: { type: Number, default: 0 },
    currentSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Session" }],
    upcomingSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Session" }],
    feedbackReceived: [
      {
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: "Person" },
        rating: Number,
        comment: String,
        date: Date,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("CoachProfile", coachProfileSchema);
