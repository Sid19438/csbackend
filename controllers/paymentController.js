const PaytmChecksum = require('paytmchecksum');

// Paytm Business configuration (will be moved to environment variables)
const PAYTM_CONFIG = {
  MERCHANT_ID: process.env.PAYTM_MERCHANT_ID || 'YOUR_MERCHANT_ID',
  MERCHANT_KEY: process.env.PAYTM_MERCHANT_KEY || 'YOUR_MERCHANT_KEY',
  WEBSITE: process.env.PAYTM_WEBSITE || 'WEBSTAGING',
  INDUSTRY_TYPE: process.env.PAYTM_INDUSTRY_TYPE || 'Retail',
  CHANNEL_ID: process.env.PAYTM_CHANNEL_ID || 'WEB',
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://securegw.paytm.in' 
    : 'https://securegw-stage.paytm.in'
};

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

    // Prepare payment parameters
    const paytmParams = {
      MID: PAYTM_CONFIG.MERCHANT_ID,
      ORDER_ID: uniqueOrderId,
      CUST_ID: customerEmail,
      TXN_AMOUNT: amount.toString(),
      CHANNEL_ID: PAYTM_CONFIG.CHANNEL_ID,
      WEBSITE: PAYTM_CONFIG.WEBSITE,
      INDUSTRY_TYPE_ID: PAYTM_CONFIG.INDUSTRY_TYPE,
      CALLBACK_URL: `${req.protocol}://${req.get('host')}/api/payment/callback`,
      EMAIL: customerEmail,
      MOBILE_NO: customerPhone,
      CUSTOMER_NAME: customerName,
      // Additional custom fields for astrology booking
      CUSTOM_FIELD1: astrologerName || '',
      CUSTOM_FIELD2: packageName || '',
      CUSTOM_FIELD3: 'Astrology Consultation'
    };

    // Generate checksum
    const checksum = await PaytmChecksum.generateSignature(paytmParams, PAYTM_CONFIG.MERCHANT_KEY);

    // Add checksum to params
    paytmParams.CHECKSUMHASH = checksum;

    res.json({
      success: true,
      data: {
        paytmParams,
        orderId: uniqueOrderId,
        redirectUrl: `${PAYTM_CONFIG.BASE_URL}/theia/processTransaction`
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

// Payment callback handler
exports.paymentCallback = async (req, res) => {
  try {
    const { 
      ORDERID, 
      TXNID, 
      TXNAMOUNT, 
      STATUS, 
      RESPCODE, 
      RESPMSG, 
      CHECKSUMHASH 
    } = req.body;

    // Verify checksum
    const isValidChecksum = PaytmChecksum.verifySignature(req.body, PAYTM_CONFIG.MERCHANT_KEY, CHECKSUMHASH);

    if (!isValidChecksum) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid checksum' 
      });
    }

    // Process payment status
    let paymentStatus = 'FAILED';
    let message = RESPMSG || 'Payment failed';

    if (STATUS === 'TXN_SUCCESS' && RESPCODE === '01') {
      paymentStatus = 'SUCCESS';
      message = 'Payment successful';
    } else if (STATUS === 'TXN_FAILURE') {
      paymentStatus = 'FAILED';
      message = RESPMSG || 'Payment failed';
    } else if (STATUS === 'PENDING') {
      paymentStatus = 'PENDING';
      message = 'Payment pending';
    }

    // Here you would typically:
    // 1. Update your database with payment status
    // 2. Send confirmation emails
    // 3. Update booking status
    // 4. Log the transaction

    const paymentResult = {
      orderId: ORDERID,
      transactionId: TXNID,
      amount: TXNAMOUNT,
      status: paymentStatus,
      message: message,
      responseCode: RESPCODE,
      timestamp: new Date().toISOString()
    };

    // For now, we'll redirect to frontend with payment status
    // In production, you might want to store this in database and redirect to a proper success/failure page
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-status?${new URLSearchParams(paymentResult).toString()}`;
    
    res.redirect(redirectUrl);

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

    // Here you would typically fetch payment status from your database
    // For now, returning a mock response
    res.json({
      success: true,
      data: {
        orderId,
        status: 'PENDING', // This should come from your database
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
