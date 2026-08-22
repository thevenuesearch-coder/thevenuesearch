# Venue Search — Email OTP Authentication

Venue Search now uses passwordless email OTP authentication for both sign in and account creation.

## Flow
1. User opens Login / Sign up.
2. Existing users choose Sign in; new users choose Create account.
3. User enters email (and name for signup).
4. Backend sends a 6-digit OTP to that email.
5. OTP expires after 10 minutes and is limited to 5 incorrect attempts.
6. A successful verification creates/signs in the account and issues the existing JWT session.
7. Resend is rate-limited to once per minute.

## Gmail SMTP setup
Copy `.env.example` to `.env` and set `SMTP_USER` to the Gmail address that will send OTPs. Use a Google App Password for `SMTP_PASS`; do not use the normal Gmail password.

Example:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-google-app-password
MAIL_FROM=Venue Search <your-email@gmail.com>
```

Restart the backend after changing `.env`.

## Important
If SMTP settings are missing, the OTP endpoint returns a configuration error instead of exposing OTPs in the browser.


## Lead notification email

After a successful OTP verification, Venue Search sends a notification to `ADMIN_EMAIL` containing the user's name, email address, phone number, login/signup type, and timestamp. The default recipient is `thevenuesearch@gmail.com`.

The SMTP settings must be configured in `.env` for both OTP delivery and admin notifications. The sender is `MAIL_FROM` (or `SMTP_USER`). For Gmail, use a Google App Password rather than the normal account password.

If SMTP is missing, the login page now shows the actual configuration error instead of a generic “Something went wrong” message.
