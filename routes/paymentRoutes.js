const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  verifyPayment,
  paymentCallback,
  getPaymentStatus,
  refundPayment
} = require('../controllers/paymentController');

// Initiate payment
router.post('/initiate', initiatePayment);

// Verify payment (Razorpay)
router.post('/verify', verifyPayment);

// Payment callback from Razorpay (webhook)
router.post('/callback', paymentCallback);

// Get payment status
router.get('/status/:orderId', getPaymentStatus);

// Refund payment
router.post('/refund', refundPayment);

module.exports = router;
