const Booking = require('../models/Booking');
const googleMeetService = require('../services/googleMeetService');
const messagingService = require('../services/messagingService');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      astrologerName,
      packageName,
      packageDuration,
      packagePrice,
      consultationDate,
      consultationTime,
      orderId,
      specialRequirements,
      notes
    } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone || !astrologerName || 
        !packageName || !packagePrice || !consultationDate || !consultationTime || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }



    // Create new booking
    const booking = new Booking({
      customerName,
      customerEmail,
      customerPhone,
      dateOfBirth: new Date(dateOfBirth),
      timeOfBirth,
      placeOfBirth,
      astrologerName,
      packageName,
      packageDuration: packageDuration || 30,
      packagePrice,

      orderId,
      paymentAmount: packagePrice,
      specialRequirements,
      notes
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: booking._id,
        orderId: booking.orderId,
        consultationDateTime: booking.consultationDateTime
      }
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus, astrologerName } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (astrologerName) query.astrologerName = { $regex: astrologerName, $options: 'i' };

    const skip = (page - 1) * limit;
    
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBookings: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message
    });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Error getting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking',
      error: error.message
    });
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.orderId;
    delete updateData.paymentStatus;
    delete updateData.transactionId;
    delete updateData.meetingLink;
    delete updateData.eventId;

    const booking = await Booking.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Cancel Google Meet if exists
    if (booking.eventId) {
      try {
        await googleMeetService.cancelMeeting(booking.eventId);
      } catch (error) {
        console.error('Error cancelling Google Meet:', error);
      }
    }

    // Update booking status
    booking.status = 'CANCELLED';
    booking.meetingStatus = 'CANCELLED';
    booking.notes = reason ? `${booking.notes || ''}\n\nCancellation Reason: ${reason}` : booking.notes;

    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

// Reschedule consultation
exports.rescheduleConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, newTime, reason } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({
        success: false,
        message: 'New date and time are required'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Only active bookings can be rescheduled'
      });
    }

    // Check if new date is in the future
    const newConsultationDateTime = new Date(newDate + 'T' + newTime);
    if (newConsultationDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'New consultation date and time must be in the future'
      });
    }

    // Update Google Meet if exists
    if (booking.eventId) {
      try {
        const updatedData = {
          start: { dateTime: newConsultationDateTime.toISOString(), timeZone: 'Asia/Kolkata' },
          end: { 
            dateTime: new Date(newConsultationDateTime.getTime() + booking.packageDuration * 60000).toISOString(), 
            timeZone: 'Asia/Kolkata' 
          }
        };

        const meetResult = await googleMeetService.updateMeeting(booking.eventId, updatedData);
        if (meetResult.success) {
          booking.meetingLink = meetResult.meetingLink;
        }
      } catch (error) {
        console.error('Error updating Google Meet:', error);
      }
    }

    // Update booking
    booking.consultationDate = new Date(newDate);
    booking.consultationTime = newTime;
    booking.notes = reason ? `${booking.notes || ''}\n\nRescheduled: ${reason}` : booking.notes;

    await booking.save();

    res.json({
      success: true,
      message: 'Consultation rescheduled successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error rescheduling consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule consultation',
      error: error.message
    });
  }
};

// Get upcoming consultations
exports.getUpcomingConsultations = async (req, res) => {
  try {
    const { astrologerName } = req.query;
    
    const query = {
      consultationDate: { $gte: new Date() },
      status: 'ACTIVE',
      paymentStatus: 'SUCCESS'
    };

    if (astrologerName) {
      query.astrologerName = { $regex: astrologerName, $options: 'i' };
    }

    const consultations = await Booking.find(query)
      .sort({ consultationDate: 1, consultationTime: 1 });

    res.json({
      success: true,
      data: consultations
    });

  } catch (error) {
    console.error('Error getting upcoming consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming consultations',
      error: error.message
    });
  }
};

// Get today's consultations
exports.getTodayConsultations = async (req, res) => {
  try {
    const { astrologerName } = req.query;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      consultationDate: { $gte: today, $lt: tomorrow },
      status: 'ACTIVE',
      paymentStatus: 'SUCCESS'
    };

    if (astrologerName) {
      query.astrologerName = { $regex: astrologerName, $options: 'i' };
    }

    const consultations = await Booking.find(query)
      .sort({ consultationTime: 1 });

    res.json({
      success: true,
      data: consultations
    });

  } catch (error) {
    console.error('Error getting today\'s consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today\'s consultations',
      error: error.message
    });
  }
};

// Send reminder for consultation
exports.sendReminder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'ACTIVE' || booking.paymentStatus !== 'SUCCESS') {
      return res.status(400).json({
        success: false,
        message: 'Only active and paid bookings can receive reminders'
      });
    }

    if (!booking.meetingLink) {
      return res.status(400).json({
        success: false,
        message: 'No meeting link available for this booking'
      });
    }

    // Send reminder
    const reminderResult = await messagingService.sendReminder(
      {
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        astrologerName: booking.astrologerName,
        consultationDate: booking.consultationDate,
        consultationTime: booking.consultationTime
      },
      booking.meetingLink
    );

    if (reminderResult.success) {
      booking.reminderSent = true;
      await booking.save();
    }

    res.json({
      success: true,
      message: 'Reminder sent successfully',
      data: reminderResult
    });

  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminder',
      error: error.message
    });
  }
};
