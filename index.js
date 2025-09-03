const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const websiteRoutes = require("./routes/websiteRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const pujaRoutes = require("./routes/pujaRoutes");

dotenv.config();
const app = express();

// Middleware
app.use(cors()); // Allows frontend to access backend
app.use(express.json()); // Parse JSON requests

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/website", websiteRoutes); // Public APIs for website
app.use("/api/dashboard", dashboardRoutes); // Protected APIs for dashboard
app.use("/api/auth", authRoutes); // Auth APIs for login
app.use("/api/payment", paymentRoutes); // Payment APIs for Paytm Business
app.use("/api/puja", pujaRoutes); // Puja APIs for CRUD operations

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
