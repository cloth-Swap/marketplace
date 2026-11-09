const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      default: "Not specified",
      trim: true
    },

    role: {
      type: String,
      enum: ["User", "Admin"],
      default: "User"
    },

    status: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active"
    },

    lastActivityAt: {
      type: Date,
      default: null
    },
    acceptedTermsVersion: {
  type: String,
  default: ""
},

acceptedTermsAt: {
  type: Date,
  default: null
},
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);