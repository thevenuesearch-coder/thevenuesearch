# The Venue Search — MERN React.js

## Latest fixes
- Build Your Wedding works in guest mode; sign-in is not required for testing.
- Each wedding event (Main Venue, Mehendi, Sangeet, Haldi, Reception) can select a real venue from the chosen destination.
- Selected venue prices roll into the wedding workspace.
- Budget Calculator uses a backend pricing engine instead of hard-coded frontend arithmetic.
- Pricing engine supports researched 2026 benchmark data and optional live Google Custom Search + AI interpretation.
- All budget values are INR.

## Run
```powershell
npm install
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:5000
Health: http://localhost:5000/api/health

## Optional live Google + AI pricing
Create `.env` from `.env.example` in the project root:

```env
PORT=5000
MONGO_URI=
GOOGLE_API_KEY=
GOOGLE_CX=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

The app works without these keys. Without them, it uses the built-in 2026 researched market benchmarks and labels the result accordingly.

If Google keys are available, the backend searches current destination-wedding pricing. If an OpenAI key is also available, the AI interprets those search snippets into market rates before the calculator runs.

## Important pricing rule
These are planning estimates, not venue quotes. Actual price depends on venue, date, room block, taxes, minimum spends, availability and vendor contracts.

## Venue action workflow

Venue detail pages now provide:
- **Check availability** — collects event date, email, and phone number, records the request, and shows the requested confirmation message.
- **Instant booking request** — checks the live date state before confirming the booking.
- **Instant holding request** — checks the live date state before creating a refundable hold; a held date remains bookable by another customer but cannot receive another hold.
- Booking and holding amounts are calculated at 10% of venue price with a **₹15,000 minimum and ₹75,000 maximum**.

SMTP settings in `.env` are used for availability-request email notifications. WhatsApp delivery requires your WhatsApp/business messaging provider integration; the request stores the customer's phone number for that follow-up.
