import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        "account_request", "account_approved", "account_rejected",
        "volunteer_assigned", "player_assigned", "coach_assigned",
        "tournament_registration", "match_scheduled", "match_result",
        "spirit_score_submitted", "spirit_score_received",
        "player_stats_submitted", "attendance_recorded",
        "session_reminder", "tournament_reminder"
      ]
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: Date,
    // Optional metadata for linking to related entities
    relatedEntityId: mongoose.Schema.Types.ObjectId,
    relatedEntityType: String, // "tournament", "match", "team", "session", etc.
    // Legacy fields for email notifications
    recipient: String, // email or phone (for backward compatibility)
    messageType: String, // approvalMail, smsCredentials, reminder (for backward compatibility)
    messageBody: String, // (for backward compatibility)
    sentAt: Date,
    status: { type: String, enum: ["sent", "failed", "pending"], default: "pending" },
  },
  { timestamps: true }
);

// Indexes for efficient queries
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
