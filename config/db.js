const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/divyajyotisha';

    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully", mongoURI);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // Don't exit, just log the error for now
    console.log("Continuing without MongoDB connection...");
  }
};

module.exports = connectDB;
