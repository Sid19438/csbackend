const axios = require('axios');

class MessagingService {
  constructor() {
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
    this.whatsappApiKey = process.env.WHATSAPP_API_KEY; // Alternative: WhatsApp Business API
  }

  // Send message via Telegram Bot (FREE)
  async sendTelegramMessage(message) {
    try {
      if (!this.telegramBotToken || !this.telegramChatId) {
        console.log('Telegram credentials not configured, skipping message');
        return { success: false, error: 'Telegram not configured' };
      }

      const response = await axios.post(
        `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
        {
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: 'HTML'
        }
      );

      if (response.data.ok) {
        console.log('Telegram message sent successfully');
        return { success: true, messageId: response.data.result.message_id };
      } else {
        throw new Error('Telegram API error');
      }

    } catch (error) {
      console.error('Error sending Telegram message:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send WhatsApp message via WhatsApp Business API (FREE tier available)
  async sendWhatsAppMessage(phoneNumber, message) {
    try {
      if (!this.whatsappApiKey) {
        console.log('WhatsApp API not configured, skipping message');
        return { success: false, error: 'WhatsApp not configured' };
      }

      // Using WhatsApp Business API (free tier available)
      const response = await axios.post(
        'https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages',
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.whatsappApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.messages && response.data.messages[0]) {
        console.log('WhatsApp message sent successfully');
        return { success: true, messageId: response.data.messages[0].id };
      } else {
        throw new Error('WhatsApp API error');
      }

    } catch (error) {
      console.error('Error sending WhatsApp message:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send email notification (FREE)
  async sendEmailNotification(toEmail, subject, message) {
    try {
      // Using Nodemailer with Gmail (free)
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: toEmail,
        subject: subject,
        html: message
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('Error sending email:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send consultation confirmation with Google Meet link
  async sendConsultationConfirmation(bookingData, meetingLink) {
    try {
      const {
        customerName,
        customerPhone,
        customerEmail,
        astrologerName,
        packageName,
        consultationDate,
        consultationTime,
        amount
      } = bookingData;

      // Format date and time
      const formattedDate = new Date(consultationDate).toLocaleDateString('en-IN');
      const formattedTime = consultationTime;

      // Create message content
      const message = `
🎉 *Consultation Confirmed!*

*Customer Details:*
• Name: ${customerName}
• Phone: ${customerPhone}
• Email: ${customerEmail}

*Consultation Details:*
• Astrologer: ${astrologerName}
• Package: ${packageName}
• Amount: ₹${amount}

*Google Meet Link:*
${meetingLink}

*Instructions:*
1. Click the link above to join the meeting anytime
2. The astrologer will be available to help you
3. Ensure you have a stable internet connection
4. Keep your camera and microphone ready
5. Join whenever you're free - no fixed time required!

*Need Help?*
Contact us at: ${process.env.SUPPORT_PHONE || '+91-XXXXXXXXXX'}

Thank you for choosing our services! 🙏
      `;

      // Send via multiple channels for reliability
      const results = {};

      // 1. Send Telegram message (FREE)
      results.telegram = await this.sendTelegramMessage(message);

      // 2. Send WhatsApp message (FREE tier available)
      if (customerPhone) {
        results.whatsapp = await this.sendWhatsAppMessage(customerPhone, message);
      }

      // 3. Send email notification (FREE)
      if (customerEmail) {
        const emailSubject = `🎯 Consultation Confirmed - ${astrologerName}`;
        results.email = await this.sendEmailNotification(customerEmail, emailSubject, message);
      }

      return {
        success: true,
        results: results,
        message: 'Consultation confirmation sent via multiple channels'
      };

    } catch (error) {
      console.error('Error sending consultation confirmation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send reminder message
  async sendReminder(bookingData, meetingLink) {
    try {
      const {
        customerName,
        customerPhone,
        customerEmail,
        astrologerName,
        consultationDate,
        consultationTime
      } = bookingData;

      const formattedDate = new Date(consultationDate).toLocaleDateString('en-IN');
      
      const reminderMessage = `
⏰ *Consultation Reminder*

Hello ${customerName},

Your consultation with ${astrologerName} is ready!

*Google Meet Link:*
${meetingLink}

You can join the meeting anytime when you're free.
The astrologer will be available to help you.

See you soon! 🙏
      `;

      const results = {};

      // Send reminder via Telegram
      results.telegram = await this.sendTelegramMessage(reminderMessage);

      // Send reminder via WhatsApp
      if (customerPhone) {
        results.whatsapp = await this.sendWhatsAppMessage(customerPhone, reminderMessage);
      }

      return {
        success: true,
        results: results
      };

    } catch (error) {
      console.error('Error sending reminder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new MessagingService();
