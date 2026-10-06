const mongoose = require("mongoose");

const swapRequestSchema = new mongoose.Schema(
  {
    clothingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clothing",
      required: true
    },

    clothingTitle: {
      type: String,
      required: true
    },

    clothingImage: {
      type: String,
      default: ""
    },

    owner: {
      type: String,
      required: true
    },

    requester: {
      type: String,
      required: true
    },

    ownerEmail: {
  type: String,
  default: ""
},

requesterEmail: {
  type: String,
  default: ""
},

    message: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Rejected"
      ],
      default: "Pending"
    },

    ownerAgreed: {
      type: Boolean,
      default: false
    },

    requesterAgreed: {
      type: Boolean,
      default: false
    },

    agreementStatus: {
      type: String,
      enum: [
        "Not Started",
        "Waiting for Both",
        "Confirmed",
        "Completed"
      ],
      default: "Not Started"
    },

    /* =====================================================
       EXCHANGE METHOD
    ===================================================== */

    exchangeMethod: {
      type: String,
      enum: [
        "Not Selected",
        "Courier",
        "Local Exchange"
      ],
      default: "Not Selected"
    },

    /*====HAND-TO-HAND MEETING DETAILS=========== */

    meetingLocation: {
      type: String,
      default: ""
    },

    meetingDate: {
      type: String,
      default: ""
    },

    meetingTime: {
      type: String,
      default: ""
    },

    meetingNotes: {
      type: String,
      default: ""
    },

    /* ====== HAND-TO-HAND CONFIRMATION=============== */

    ownerCompleted: {
      type: Boolean,
      default: false
    },

    requesterCompleted: {
      type: Boolean,
      default: false
    },

    completionStatus: {
      type: String,
      enum: [
        "Not Started",
        "Waiting for Both",
        "Completed"
      ],
      default: "Not Started"
    }
  },

  {
    timestamps: true
  }
);

module.exports =
  mongoose.model(
    "SwapRequest",
    swapRequestSchema
  );