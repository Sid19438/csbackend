const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  paymentCallback,
  getPaymentStatus
} = require('../controllers/paymentController');

// Initiate payment
router.post('/initiate', initiatePayment);

// Payment callback from Paytm
router.post('/callback', paymentCallback);

// Get payment status
router.get('/status/:orderId', getPaymentStatus);

module.exports = router;
