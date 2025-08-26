const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  getBanners,
} = require("../controllers/websiteController");

// Import astrologer methods from dashboard controller
const {
  getAstrologers,
  getAstrologer,
} = require("../controllers/dashboardController");

// Product routes
router.get("/products", getProducts);
router.get("/products/:id", getProductById);

// Public banners
router.get("/banners", getBanners);

// Astrologer routes (public access)
router.get("/astrologers", getAstrologers);
router.get("/astrologers/:id", getAstrologer);

module.exports = router;
