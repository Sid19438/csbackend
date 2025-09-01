const Razorpay = require('razorpay');

// Razorpay configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// Initiate payment
exports.initiatePayment = async (req, res) => {
  try {
    const { 
      amount, 
      customerName, 
      customerEmail, 
      customerPhone, 
      orderId,
      astrologerName,
      packageName 
    } = req.body;

    if (!amount || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Generate unique order ID if not provided
    const uniqueOrderId = orderId || `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: uniqueOrderId,
      notes: {
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        astrologerName: astrologerName || '',
        packageName: packageName || '',
        serviceType: 'Astrology Consultation'
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        receipt: order.receipt,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        customerName,
        customerEmail,
        customerPhone,
        astrologerName,
        packageName
      }
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initiate payment',
      error: error.message 
    });
  }
};

// Payment verification
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      customerName,
      customerEmail,
      customerPhone,
      astrologerName,
      packageName
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing payment verification parameters' 
      });
    }

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment signature' 
      });
    }

    // Payment is verified successfully
    // Here you would typically:
    // 1. Update your database with payment status
    // 2. Send confirmation emails
    // 3. Update booking status
    // 4. Log the transaction

    const paymentResult = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      status: 'SUCCESS',
      message: 'Payment verified successfully',
      customerName,
      customerEmail,
      customerPhone,
      astrologerName,
      packageName,
      timestamp: new Date().toISOString()
    };

    // Redirect to frontend with payment status
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-status?${new URLSearchParams(paymentResult).toString()}`;
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed',
      error: error.message 
    });
  }
};

// Payment callback handler (for webhook if needed)
exports.paymentCallback = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    // Verify webhook signature if needed
    // For now, just acknowledge the webhook
    res.json({ success: true, message: 'Webhook received' });

  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment callback processing failed',
      error: error.message 
    });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID is required' 
      });
    }

    // Fetch order details from Razorpay
    const order = await razorpay.orders.fetch(orderId);
    
    // Fetch payment details if payment exists
    let paymentDetails = null;
    try {
      const payments = await razorpay.orders.fetchPayments(orderId);
      if (payments.items && payments.items.length > 0) {
        paymentDetails = payments.items[0];
      }
    } catch (error) {
      console.log('No payment found for order:', orderId);
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount / 100, // Convert from paise to rupees
        currency: order.currency,
        status: order.status,
        receipt: order.receipt,
        paymentStatus: paymentDetails ? paymentDetails.status : 'PENDING',
        paymentId: paymentDetails ? paymentDetails.id : null,
        message: 'Payment status retrieved successfully'
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get payment status',
      error: error.message 
    });
  }
};

// Refund payment
exports.refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment ID is required' 
      });
    }

    const refundOptions = {
      amount: amount ? Math.round(amount * 100) : undefined, // Amount in paise, if not provided will refund full amount
      speed: 'normal', // or 'optimum'
      notes: {
        reason: reason || 'Customer request'
      }
    };

    const refund = await razorpay.payments.refund(paymentId, refundOptions);

    res.json({
      success: true,
      data: {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount / 100,
        status: refund.status,
        message: 'Refund initiated successfully'
      }
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process refund',
      error: error.message 
    });
  }
};
