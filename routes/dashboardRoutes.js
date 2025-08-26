const express = require("express");
const router = express.Router();
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
} = require("../controllers/dashboardController");
const auth = require("../middleware/auth");

// Astrologer routes (unprotected to match current frontend)
const {
  getAstrologers,
  getAstrologer,
  createAstrologer,
  updateAstrologer,
  deleteAstrologer,
  toggleAstrologerStatus,
} = require("../controllers/dashboardController");

router.get("/astrologers", getAstrologers);
router.get("/astrologers/:id", getAstrologer);
router.post("/astrologers", createAstrologer);
router.put("/astrologers/:id", updateAstrologer);
router.delete("/astrologers/:id", deleteAstrologer);
router.patch("/astrologers/:id/toggle", toggleAstrologerStatus);

router.get("/products", auth, getProducts); // Optional: for dashboard listing
router.post("/products", auth, createProduct);
router.put("/products/:id", auth, updateProduct);
router.delete("/products/:id", auth, deleteProduct);

module.exports = router;
