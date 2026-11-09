
const mongoose = require("mongoose");

const clothingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    
    brand: {
      type: String,
      default: ""
    },

    category: {
      type: String,
      required: true
    },

    size: {
      type: String,
      required: true
    },

    condition: {
      type: String,
      required: true
    },

    location: {
      type: String,
      default: ""
    },

    price: {
      type: Number,
      default: 0
    },

    description: {
      type: String,
      default: ""
    },

    image: {
      type: String,
      default: ""
    },

    owner: {
      type: String,
      default: "Anonymous"
    },

    ownerEmail: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      default: "Available"
    },

    // Historical Listing Fields
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
      default: null
    },
    removalReason: {
  type: String,
  default: ""
},

    listingStatus: {
      type: String,
      enum: ["Available", "Swapped", "Removed"],
      default: "Available"
    },

    swappedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Clothing", clothingSchema);
