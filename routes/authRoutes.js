const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

router.post("/register", register); // Optional: for initial admin setup
router.post("/login", login);

module.exports = router;
