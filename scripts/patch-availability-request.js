const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src', 'App.js');
let source = fs.readFileSync(file, 'utf8');

// This script runs after patch-frontend.js. It is intentionally idempotent.
if (!source.includes("const [availabilityEmail, setAvailabilityEmail] = useState('');")) {
  source = source.replace(
    "const [checkingAvailability, setCheckingAvailability] = useState(false);",
    "const [checkingAvailability, setCheckingAvailability] = useState(false);\n  const [availabilityEmail, setAvailabilityEmail] = useState('');\n  const [availabilityPhone, setAvailabilityPhone] = useState('');\n  const [availabilitySubmitted, setAvailabilitySubmitted] = useState(false);"
  );
}

// Replace the availability function with DOM-first validation. Chrome/Google
// autofill can fill the visible input without firing React onChange.
const start = source.indexOf('  const checkAvailability = async () => {');
if (start < 0) throw new Error('Availability check block not found.');
const end = source.indexOf('\n  };', start);
if (end < 0) throw new Error('Availability check block end not found.');

const newCheck = `  const checkAvailability = async () => {
    if (!date) return setMessage('Please select a wedding date.');

    const emailInputs = Array.from(document.querySelectorAll('.availability-contact-fields input[type="email"]'));
    const phoneInputs = Array.from(document.querySelectorAll('.availability-contact-fields input[type="tel"]'));
    const emailInput = emailInputs.find(input => input.offsetParent !== null) || emailInputs[0];
    const phoneInput = phoneInputs.find(input => input.offsetParent !== null) || phoneInputs[0];

    const emailValue = String(emailInput?.value || availabilityEmail || '').trim().replace(/\s+/g, '');
    const phoneValue = String(phoneInput?.value || availabilityPhone || '').trim();

    // Do not use input.validity here. The live DOM value is the source of truth.
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailValue)) {
      return setMessage('Please enter a valid email address.');
    }

    const phoneDigits = phoneValue.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return setMessage('Please enter a valid phone number.');
    }

    setAvailabilityEmail(emailValue);
    setAvailabilityPhone(phoneValue);
    setCheckingAvailability(true);
    setMessage('');
    setAvailabilitySubmitted(false);

    try {
      const result = await api.availability(venue.id, date);
      setAvailability(result);

      await api.requestAvailability({
        venueId: String(venue.id),
        venueName: String(venue.name),
        city: String(venue.city || ''),
        state: String(venue.state || ''),
        date: String(date),
        email: emailValue,
        phone: phoneValue,
        availabilityStatus: String(result.status || 'unknown')
      });

      setAvailabilitySubmitted(true);
      setMessage('');
    } catch (e) {
      setMessage(e.message || 'Unable to submit the availability request right now.');
    } finally {
      setCheckingAvailability(false);
    }
  };`;

source = source.slice(0, start) + newCheck + source.slice(end + '\n  };'.length);

// Pass contact state to BookingSheet.
source = source.replace(
  "{showBooking && <BookingSheet venue={venue} action={bookingAction} date={date} setDate={setDate} event={event} setEvent={setEvent} availability={availability} checkingAvailability={checkingAvailability} submit={submit} message={message} close={closeAction}/>} ",
  "{showBooking && <BookingSheet venue={venue} action={bookingAction} date={date} setDate={setDate} event={event} setEvent={setEvent} availability={availability} checkingAvailability={checkingAvailability} availabilityEmail={availabilityEmail} setAvailabilityEmail={setAvailabilityEmail} availabilityPhone={availabilityPhone} setAvailabilityPhone={setAvailabilityPhone} availabilitySubmitted={availabilitySubmitted} setAvailabilitySubmitted={setAvailabilitySubmitted} submit={submit} message={message} close={closeAction}/>} "
);

source = source.replace(
  "function BookingSheet({venue,action,date,setDate,event,setEvent,availability,checkingAvailability,submit,message,close}) {",
  "function BookingSheet({venue,action,date,setDate,event,setEvent,availability,checkingAvailability,availabilityEmail,setAvailabilityEmail,availabilityPhone,setAvailabilityPhone,availabilitySubmitted,setAvailabilitySubmitted,submit,message,close}) {"
);

// Add email + phone fields once, immediately after the Event field.
if (!source.includes('availability-contact-fields')) {
  const eventField = /(<label className="input-label">Event[\s\S]*?<\/label>)/;
  const contactFields = `$1
    {action === 'availability' && !availabilitySubmitted && <div className="availability-contact-fields">
      <label className="input-label">Email address
        <input type="email" value={availabilityEmail} onInput={e => setAvailabilityEmail(e.currentTarget.value)} onChange={e => setAvailabilityEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
      </label>
      <label className="input-label">Phone number
        <input type="tel" value={availabilityPhone} onInput={e => setAvailabilityPhone(e.currentTarget.value)} onChange={e => setAvailabilityPhone(e.target.value)} placeholder="10-digit mobile number" autoComplete="tel" inputMode="tel" required />
      </label>
    </div>`;
  if (!eventField.test(source)) throw new Error('Booking event field not found.');
  source = source.replace(eventField, contactFields);
} else {
  source = source.replace(
    /<input type="email" value=\{availabilityEmail\}[^>]*>/,
    '<input type="email" value={availabilityEmail} onInput={e => setAvailabilityEmail(e.currentTarget.value)} onChange={e => setAvailabilityEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />'
  );
  source = source.replace(
    /<input type="tel" value=\{availabilityPhone\}[^>]*>/,
    '<input type="tel" value={availabilityPhone} onInput={e => setAvailabilityPhone(e.currentTarget.value)} onChange={e => setAvailabilityPhone(e.target.value)} placeholder="10-digit mobile number" autoComplete="tel" inputMode="tel" required />'
  );
}

// Replace the three action buttons with the confirmation state for availability.
const actionPattern = /      <div className="booking-action-grid">[\s\S]*?<\/div>/;
if (!source.includes('availability-confirmation')) {
  const confirmation = `      {action === 'availability' && availabilitySubmitted ? <div className="availability-confirmation">
        <div className="availability-confirmation-icon"><Check size={22}/></div>
        <h3>Availability request submitted</h3>
        <p>The availability details will be shared via mail and WhatsApp.</p>
        <button className="primary-button wide" onClick={() => { setAvailabilitySubmitted(false); setMessage(''); setAvailability(null); }}>Done</button>
      </div> : <div className="booking-action-grid">
        <button className="outline-button wide" onClick={() => submit('availability')} disabled={checkingAvailability}>{checkingAvailability ? 'Checking…' : 'Check availability'}</button>
        <button className="outline-button wide" onClick={() => submit('book')} disabled={!!availability && !availability.canBook}>Book venue</button>
        <button className="primary-button wide" onClick={() => submit('hold')} disabled={!!availability && !availability.canHold}>Hold this date <ArrowRight size={16}/></button>
      </div>}`;
  if (actionPattern.test(source)) source = source.replace(actionPattern, confirmation);
}

fs.writeFileSync(file, source);
console.log('Availability workflow fixed: live DOM email validation, autofill support, contact capture and confirmation.');
