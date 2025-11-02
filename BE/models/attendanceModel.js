import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    personId: { type: mongoose.Schema.Types.ObjectId, ref: "Person", required: true },
    status: { type: String, enum: ["present", "absent", "late"], default: "absent" },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Person", required: true },
    date: { type: Date, required: true }, // Date of the session
    recordedAt: { type: Date, default: Date.now }, // When attendance was marked
  },
  { timestamps: true }
);

// Ensure one attendance record per player per session
attendanceSchema.index({ sessionId: 1, personId: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
