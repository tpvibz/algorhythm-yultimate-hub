import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tournament name is required"],
      trim: true,
      maxlength: [100, "Tournament name cannot be more than 100 characters"]
    },
    startDate: {
      type: Date,
      required: [true, "Tournament start date is required"]
    },
    endDate: {
      type: Date,
      required: [true, "Tournament end date is required"]
    },
    location: {
      type: String,
      required: [true, "Tournament location is required"],
      trim: true,
      maxlength: [200, "Location cannot be more than 200 characters"]
    },
    maxTeams: {
      type: Number,
      required: [true, "Maximum teams is required"],
      min: [2, "Minimum 2 teams required"],
      max: [64, "Maximum 64 teams allowed"],
      default: 24
    },
    division: {
      type: String,
      enum: ['Open Division', 'Women\'s Division', 'Mixed Division', 'Open & Women\'s', 'Youth Division'],
      required: [true, "Tournament division is required"]
    },
    format: {
      type: String,
      enum: ['pool-play-bracket', 'single-elimination', 'double-elimination', 'round-robin', 'swiss'],
      required: [true, "Tournament format is required"],
      default: 'pool-play-bracket'
    },
    prizePool: {
      type: String,
      required: [true, "Prize pool is required"],
      trim: true
    },
    description: {
      type: String,
      required: [true, "Tournament description is required"],
      maxlength: [1000, "Description cannot be more than 1000 characters"]
    },
    rules: {
      type: String,
      required: [true, "Tournament rules are required"],
      maxlength: [2000, "Rules cannot be more than 2000 characters"]
    },
    registrationDeadline: {
      type: Date,
      required: [true, "Registration deadline is required"]
    },
    image: {
      type: String,
      default: null
    },
    // Store image binary directly in MongoDB when provided
    imageData: {
      type: Buffer,
      default: undefined
    },
    imageContentType: {
      type: String,
      default: undefined
    },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed', 'cancelled'],
      default: 'upcoming'
    },
    registeredTeams: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      }],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      required: false // Make optional until authentication is implemented
    },
    // Legacy fields (keeping for compatibility)
    date: Date,
    sponsors: [String],
    bannerUrl: String
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for better query performance
tournamentSchema.index({ startDate: 1 });
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ createdBy: 1 });
tournamentSchema.index({ division: 1 });

// Virtual for checking if tournament is full
tournamentSchema.virtual('isFull').get(function() {
  const registeredCount = this.registeredTeams ? this.registeredTeams.length : 0;
  return registeredCount >= this.maxTeams;
});

// Virtual for available spots
tournamentSchema.virtual('availableSpots').get(function() {
  const registeredCount = this.registeredTeams ? this.registeredTeams.length : 0;
  return this.maxTeams - registeredCount;
});

// Virtual for registration status
tournamentSchema.virtual('registrationOpen').get(function() {
  return new Date() < this.registrationDeadline && this.status === 'upcoming';
});

export default mongoose.model("Tournament", tournamentSchema);
