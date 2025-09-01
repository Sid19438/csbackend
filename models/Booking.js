const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  // Customer Information
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Birth Details
  dateOfBirth: {
    type: Date,
    required: true
  },
  timeOfBirth: {
    type: String,
    required: false
  },
  placeOfBirth: {
    type: String,
    required: false,
    trim: true
  },
  
  // Consultation Details
  astrologerName: {
    type: String,
    required: true,
    trim: true
  },
  packageName: {
    type: String,
    required: true,
    trim: true
  },
  packageDuration: {
    type: Number,
    required: true,
    default: 30 // minutes
  },
  packagePrice: {
    type: Number,
    required: true
  },
  

  
  // Payment Information
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  transactionId: {
    type: String,
    required: false
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  paymentAmount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  
  // Google Meet Information
  meetingLink: {
    type: String,
    required: false
  },
  eventId: {
    type: String,
    required: false
  },
  meetingStatus: {
    type: String,
    enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'SCHEDULED'
  },
  
  // Communication Status
  confirmationSent: {
    type: Boolean,
    default: false
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  
  // Additional Information
  specialRequirements: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Status and Timestamps
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
BookingSchema.index({ customerEmail: 1 });
BookingSchema.index({ customerPhone: 1 });
BookingSchema.index({ consultationDate: 1 });
BookingSchema.index({ paymentStatus: 1 });
BookingSchema.index({ orderId: 1 }, { unique: true });

// Virtual field for consultation date and time
BookingSchema.virtual('consultationDateTime').get(function() {
  if (this.consultationDate && this.consultationTime) {
    const date = new Date(this.consultationDate);
    const [hours, minutes] = this.consultationTime.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  }
  return null;
});

// Method to check if consultation is upcoming
BookingSchema.methods.isUpcoming = function() {
  const now = new Date();
  const consultationTime = this.consultationDateTime;
  return consultationTime && consultationTime > now;
};

// Method to check if consultation is today
BookingSchema.methods.isToday = function() {
  const now = new Date();
  const consultationDate = new Date(this.consultationDate);
  return consultationDate.toDateString() === now.toDateString();
};

// Method to get time until consultation
BookingSchema.methods.getTimeUntilConsultation = function() {
  const now = new Date();
  const consultationTime = this.consultationDateTime;
  
  if (!consultationTime) return null;
  
  const diff = consultationTime - now;
  if (diff <= 0) return 'PAST';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day(s) ${hours % 24} hour(s)`;
  } else if (hours > 0) {
    return `${hours} hour(s) ${minutes} minute(s)`;
  } else {
    return `${minutes} minute(s)`;
  }
};

// Pre-save middleware to update updatedAt
BookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find upcoming consultations
BookingSchema.statics.findUpcoming = function() {
  const now = new Date();
  return this.find({
    consultationDate: { $gte: now },
    status: 'ACTIVE',
    paymentStatus: 'SUCCESS'
  }).sort({ consultationDate: 1 });
};

// Static method to find consultations for today
BookingSchema.statics.findToday = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    consultationDate: { $gte: today, $lt: tomorrow },
    status: 'ACTIVE',
    paymentStatus: 'SUCCESS'
  }).sort({ consultationTime: 1 });
};

module.exports = mongoose.model('Booking', BookingSchema);
