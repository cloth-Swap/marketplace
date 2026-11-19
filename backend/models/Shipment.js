const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
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
    
receiverEmail: {
  type: String,
  trim: true,
  lowercase: true,
  default: ""
},

 pickupAddress: {
      type: String,
      default: "",
      trim: true
    },

    deliveryAddress: {
      type: String,
      default: "",
      trim: true
    },

    clothingTitle: {
      type: String,
      default: "Clothing Item",
      trim: true
    },

    packageWeight: {
      type: Number,
      default: 1
    },

    courierName: {
      type: String,
      default: "ClothSwap Courier",
      trim: true
    },
    courierMode: {
  type: String,
  enum: ["Automatic", "Manual"],
  default: "Automatic"
},

    trackingId: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },

    shippingCost: {
      type: Number,
      default: 0
    },

    pickupDate: {
      type: Date,
      default: null
    },

    otp: {
      type: String,
      required: true
    },

    otpVerified: {
      type: Boolean,
      default: false
    },

    parcelArrived: {
      type: Boolean,
      default: false
    },

    deliveryConfirmed: {
      type: Boolean,
      default: false
    },
  senderNotification: {
  type: String,
  default: ""
},

senderNotified: {
  type: Boolean,
  default: false
},
    status: {
      type: String,
      enum: [
        "Courier Requested",
        "Pickup Scheduled",
        "Picked Up",
        "In Transit",
        "Out for Delivery",
        "Arrived",
        "OTP Verified",
        "Delivered",
        "Cancelled"
      ],
      default: "Courier Requested"
    },

    deliveredAt: {
      type: Date,
      default: null
    },
    // Courier Receiver 48 Hours Confirmation System

receiverReminder24Sent: {
  type: Boolean,
  default: false
},

receiverReminder36Sent: {
  type: Boolean,
  default: false
},

receiverConfirmationOverdue: {
  type: Boolean,
  default: false
}
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Shipment", shipmentSchema);