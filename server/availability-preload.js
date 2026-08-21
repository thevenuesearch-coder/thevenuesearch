const expressPath = require.resolve('express');
const express = require(expressPath);

if (!express.__availabilityRequestPatched) {
  const originalListen = express.application.listen;

  express.application.listen = function patchedListen(...args) {
    if (!this.__availabilityRequestInstalled) {
      this.__availabilityRequestInstalled = true;

      this.post('/api/availability-request', async (req, res) => {
        try {
          const body = req.body || {};
          const venueId = String(body.venueId || '').trim();
          const venueName = String(body.venueName || '').trim();
          const city = String(body.city || '').trim();
          const state = String(body.state || '').trim();
          const date = String(body.date || '').trim();
          const email = String(body.email || '').trim();
          const phone = String(body.phone || '').trim();
          const availabilityStatus = String(body.availabilityStatus || 'unknown').trim();

          if (!venueId || !venueName || !date || !email || !phone) return res.status(400).json({ message: 'Venue, date, email and phone number are required.' });
          if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });

          const phoneDigits = phone.replace(/\D/g, '');
          if (phoneDigits.length < 10 || phoneDigits.length > 15) return res.status(400).json({ message: 'Enter a valid phone number.' });

          const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
          if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return res.status(503).json({ message: 'Email service is not configured on the backend.' });

          const transporter = require('nodemailer').createTransport({
            host: SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: String(process.env.SMTP_SECURE || 'false') === 'true',
            auth: { user: SMTP_USER, pass: SMTP_PASS }
          });

          await transporter.sendMail({
            from: process.env.MAIL_FROM || SMTP_USER,
            to: 'thevenuesearch@gmail.com',
            replyTo: email,
            subject: `Venue Search - Availability Request - ${venueName}`,
            text: [
              'NEW VENUE AVAILABILITY REQUEST', '',
              `Venue: ${venueName}`,
              `Venue ID: ${venueId}`,
              `Location: ${city}${state ? `, ${state}` : ''}`,
              `Requested date: ${date}`,
              `Customer email: ${email}`,
              `Customer phone: ${phone}`,
              `Current availability status: ${availabilityStatus}`,
              '',
              'Please share the availability details with the customer by email and WhatsApp.'
            ].join('\n')
          });

          return res.status(200).json({ success: true, message: 'Availability request sent.' });
        } catch (error) {
          console.error('Availability request email error:', error);
          return res.status(500).json({ message: 'Unable to send the availability request email.' });
        }
      });
    }

    return originalListen.apply(this, args);
  };

  express.__availabilityRequestPatched = true;
}
