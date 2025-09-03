const express = require("express");
const router = express.Router();
const {
  getPujas,
  getPuja,
  createPuja,
  updatePuja,
  deletePuja,
  togglePujaStatus,
} = require("../controllers/pujaController");

// Puja routes (unprotected to match current frontend pattern)
router.get("/pujas", getPujas);
router.get("/pujas/:id", getPuja);
router.post("/pujas", createPuja);
router.put("/pujas/:id", updatePuja);
router.delete("/pujas/:id", deletePuja);
router.patch("/pujas/:id/toggle", togglePujaStatus);

module.exports = router;
