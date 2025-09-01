const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  rescheduleConsultation,
  getUpcomingConsultations,
  getTodayConsultations,
  sendReminder
} = require('../controllers/bookingController');

// Create a new booking
router.post('/', createBooking);

// Get all bookings with pagination and filters
router.get('/', getAllBookings);

// Get upcoming consultations
router.get('/upcoming', getUpcomingConsultations);

// Get today's consultations
router.get('/today', getTodayConsultations);

// Get booking by ID
router.get('/:id', getBookingById);

// Update booking
router.put('/:id', updateBooking);

// Cancel booking
router.patch('/:id/cancel', cancelBooking);

// Reschedule consultation
router.patch('/:id/reschedule', rescheduleConsultation);

// Send reminder
router.post('/:id/reminder', sendReminder);

module.exports = router;

