const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    swapRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SwapRequest",
      required: true
    },

    sender: {
      type: String,
      required: true,
      trim: true
    },

    receiver: {
      type: String,
      required: true,
      trim: true
    },

    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Message",
  messageSchema
);