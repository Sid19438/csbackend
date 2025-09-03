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

// Import puja methods from puja controller
const {
  getPujas,
  getPuja,
} = require("../controllers/pujaController");

// Product routes
router.get("/products", getProducts);
router.get("/products/:id", getProductById);

// Public banners
router.get("/banners", getBanners);

// Astrologer routes (public access)
router.get("/astrologers", getAstrologers);
router.get("/astrologers/:id", getAstrologer);

// Puja routes (public access)
router.get("/pujas", getPujas);
router.get("/pujas/:id", getPuja);

module.exports = router;
