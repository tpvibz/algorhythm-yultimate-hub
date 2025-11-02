import mongoose from "mongoose";

const playerProfileSchema = new mongoose.Schema(
  {
    personId: { type: mongoose.Schema.Types.ObjectId, ref: "Person", unique: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    assignedCoachId: { type: mongoose.Schema.Types.ObjectId, ref: "Person" },
    // Player registration fields
    age: Number,
    gender: String,
    experience: String,
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
    // Stats
    totalMatchesPlayed: { type: Number, default: 0 },
    totalGoals: { type: Number, default: 0 },
    totalAssists: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    spiritAverage: { type: Number, default: 0 },
    tournamentsPlayed: { type: Number, default: 0 },
    teamRank: { type: Number, default: 0 },
    achievementsCount: { type: Number, default: 0 },
    pastTournaments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tournament" }],
    currentTournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
    upcomingMatches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Match" }],
    feedback: [
      {
        coachId: { type: mongoose.Schema.Types.ObjectId, ref: "Person" },
        rating: Number,
        comments: String,
        date: Date,
      },
    ],
    // Transfer system
    transferRequest: {
      from: {
        affiliationType: String,
        name: String,
        location: String,
      },
      to: {
        affiliationType: String,
        id: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
        name: String,
        location: String,
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", null],
        default: null,
      },
      requestedOn: Date,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Person" },
      reviewedAt: Date,
    },
    transferHistory: [
      {
        from: {
          affiliationType: String,
          name: String,
          location: String,
        },
        to: {
          affiliationType: String,
          name: String,
          location: String,
        },
        date: Date,
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Person" },
        reason: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("PlayerProfile", playerProfileSchema);
