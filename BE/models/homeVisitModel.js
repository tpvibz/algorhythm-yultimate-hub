import mongoose from "mongoose";

const homeVisitSchema = new mongoose.Schema(
  {
    personId: { type: mongoose.Schema.Types.ObjectId, ref: "Person" },
    visitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Person" },
    visitDate: Date,
    durationMinutes: Number,
    notes: String,
    remarks: String,
    attachments: [String],
  },
  { timestamps: true }
);

export default mongoose.model("HomeVisit", homeVisitSchema);
