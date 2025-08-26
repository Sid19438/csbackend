const mongoose = require("mongoose");

const AstrologerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    expertise: {
      type: String,
      required: true,
      trim: true,
    },
    languages: {
      type: String,
      default: "",
      trim: true,
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    avatar: {
      type: String,
      default: "",
      trim: true,
    },
    about: {
      type: String,
      default: "",
      trim: true,
    },
    specializations: {
      type: [String],
      default: [],
    },
    plans: {
      type: Array,
      default: [],
    },
    gallery: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    consultationUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Astrologer", AstrologerSchema);



