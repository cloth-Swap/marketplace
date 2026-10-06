const mongoose = require("mongoose");

const clothingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Clothing", clothingSchema);