const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

class GoogleMeetService {
  constructor() {
    this.auth = null;
    this.calendar = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Initialize OAuth2 client
      this.auth = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      // Set credentials from environment variables
      this.auth.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        access_token: process.env.GOOGLE_ACCESS_TOKEN
      });

      // Create calendar instance
      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      
      console.log('Google Calendar API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Calendar API:', error);
    }
  }

  async generateMeetingLink(bookingData) {
    try {
      if (!this.calendar) {
        throw new Error('Google Calendar API not initialized');
      }

      const {
        customerName,
        customerEmail,
        customerPhone,
        astrologerName,
        packageName,
        consultationDate,
        consultationTime,
        duration = 30 // Default 30 minutes
      } = bookingData;

      // Calculate start and end time - use current time + 1 hour for immediate availability
      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const endTime = new Date(startTime.getTime() + duration * 60000); // Add duration in minutes

      // Format times for Google Calendar
      const startTimeISO = startTime.toISOString();
      const endTimeISO = endTime.toISOString();

      // Create event with Google Meet
      const event = {
        summary: `Astrology Consultation - ${astrologerName}`,
        description: `
          Consultation Details:
          - Customer: ${customerName}
          - Package: ${packageName}
          - Duration: ${duration} minutes
          - Type: Astrology Consultation
          
          Please join the meeting on time.
        `,
        start: {
          dateTime: startTimeISO,
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: endTimeISO,
          timeZone: 'Asia/Kolkata',
        },
        attendees: [
          { email: customerEmail, displayName: customerName },
          { email: process.env.ASTROLOGER_EMAIL || 'astrologer@example.com', displayName: astrologerName }
        ],
        conferenceData: {
          createRequest: {
            requestId: `meet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 15 } // 15 minutes before
          ]
        }
      };

      // Insert event into calendar
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all'
      });

      const meetingLink = response.data.conferenceData?.entryPoints?.[0]?.uri;
      
      if (!meetingLink) {
        throw new Error('Failed to generate Google Meet link');
      }

      // Return meeting details
      return {
        success: true,
        meetingLink: meetingLink,
        eventId: response.data.id,
        startTime: startTimeISO,
        endTime: endTimeISO,
        summary: event.summary,
        description: event.description
      };

    } catch (error) {
      console.error('Error generating Google Meet link:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateMeeting(eventId, updatedData) {
    try {
      if (!this.calendar) {
        throw new Error('Google Calendar API not initialized');
      }

      const response = await this.calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        resource: updatedData,
        sendUpdates: 'all'
      });

      return {
        success: true,
        eventId: response.data.id,
        meetingLink: response.data.conferenceData?.entryPoints?.[0]?.uri
      };

    } catch (error) {
      console.error('Error updating meeting:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cancelMeeting(eventId) {
    try {
      if (!this.calendar) {
        throw new Error('Google Calendar API not initialized');
      }

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      return { success: true };

    } catch (error) {
      console.error('Error canceling meeting:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getMeetingDetails(eventId) {
    try {
      if (!this.calendar) {
        throw new Error('Google Calendar API not initialized');
      }

      const response = await this.calendar.events.get({
        calendarId: 'primary',
        eventId: eventId
      });

      return {
        success: true,
        event: response.data
      };

    } catch (error) {
      console.error('Error getting meeting details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new GoogleMeetService();
