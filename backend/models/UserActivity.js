const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    userName: {
      type: String,
      default: ""
    },
    userEmail: {
      type: String,
      default: ""
    },
    activityType: {
      type: String,
      enum: [
        "Login",
        "Registration",
        "Listing Created",
        "Swap Requested",
        "Swap Accepted",
        "Swap Completed",
        "Dispute Reported",
        "Dispute Resolved"
      ],
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    relatedId: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

userActivitySchema.index({ createdAt: -1 });
userActivitySchema.index({ userEmail: 1, createdAt: -1 });

module.exports = mongoose.model(
  "UserActivity",
  userActivitySchema
);