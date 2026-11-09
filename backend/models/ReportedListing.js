
const mongoose = require("mongoose");

const reportedListingSchema = new mongoose.Schema(
  {
    clothingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clothing",
      required: true
    },

    listingTitle: {
      type: String,
      default: ""
    },

    reporter: {
      type: String,
      required: true
    },

    reporterEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    owner: {
      type: String,
      default: ""
    },

    ownerEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true
    },

    reason: {
      type: String,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Removed", "Rejected"],
      default: "Pending"
    },

    adminNote: {
      type: String,
      default: ""
    },

    reviewedBy: {
      type: String,
      default: ""
    },

    reviewedAt: {
      type: Date,
      default: null
    },

    actionHistory: [
      {
        action: {
          type: String,
          enum: ["Reviewed", "Removed", "Rejected"]
        },
        adminName: {
          type: String,
          default: ""
        },
        adminEmail: {
          type: String,
          default: ""
        },
        adminNote: {
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

module.exports = mongoose.model("ReportedListing", reportedListingSchema);
