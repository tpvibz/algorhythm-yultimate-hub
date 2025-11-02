import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["school", "community"],
      required: true,
    },
    coachIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person",
      },
    ],
    description: String,
    contactEmail: String,
    contactPhone: String,
  },
  { timestamps: true }
);

// Index for faster queries
schoolSchema.index({ type: 1, location: 1 });

export default mongoose.model("School", schoolSchema);

