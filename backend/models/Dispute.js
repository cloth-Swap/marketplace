const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    swapRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SwapRequest",
      required: true
    },

    reportedBy: {
      type: String,
      required: true,
      trim: true
    },

    reportedAgainst: {
      type: String,
      default: "Not specified",
      trim: true
    },

    reason: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    status: {
      type: String,
      enum: ["Pending", "Resolved"],
      default: "Pending"
    },

    adminNote: {
      type: String,
      default: "",
      trim: true
    },

    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Dispute", disputeSchema);