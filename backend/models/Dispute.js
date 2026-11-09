
const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    swapRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SwapRequest",
      default: null
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

    subject: {
      type: String,
      default: ""
    },

    reportedUser: {
      type: String,
      default: ""
    },

    reporterEmail: {
      type: String,
      default: ""
    },

    relatedSwap: {
      type: String,
      default: ""
    },

    attachments: [
      {
        name: String,
        size: Number,
        preview: String
      }
    ],

   status: {
  type: String,
  enum: ["Pending", "Under Review", "Resolved", "Rejected"],
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
},
isDeleted: {
  type: Boolean,
  default: false
},

deletedAt: {
  type: Date,
  default: null
},

deletedBy: {
  type: String,
  default: ""
},

resolutionHistory: [
  {
    action: {
      type: String,
enum: ["Under Review", "Resolved", "Rejected", "Deleted"]    },

    adminNote: {
      type: String,
      default: ""
    },

    adminName: {
      type: String,
      default: ""
    },

    adminEmail: {
      type: String,
      default: ""
    },

    actionDate: {
      type: Date,
      default: Date.now
    }
  }
]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Dispute", disputeSchema);
