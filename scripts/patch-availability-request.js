const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src', 'App.js');
let source = fs.readFileSync(file, 'utf8');

// This patch runs after patch-frontend.js and is intentionally idempotent.
if (!source.includes("const [availabilityEmail, setAvailabilityEmail] = useState('');")) {
  source = source.replace(
    "const [checkingAvailability, setCheckingAvailability] = useState(false);",
    "const [checkingAvailability, setCheckingAvailability] = useState(false);\n  const [availabilityEmail, setAvailabilityEmail] = useState('');\n  const [availabilityPhone, setAvailabilityPhone] = useState('');\n  const [availabilitySubmitted, setAvailabilitySubmitted] = useState(false);"
  );
}

// The visible value in the input is authoritative. Do not reject a valid
// address because React state or browser autofill is one render behind.
const start = source.indexOf('  const checkAvailability = async () => {');
if (start < 0) throw new Error('Availability check block not found.');
const end = source.indexOf('\n  };', start);
if (end < 0) throw new Error('Availability check block end not found.');

const newCheck = `  const checkAvailability = async () => {
    if (!date) return setMessage('Please select a wedding date.');

    const emailInputs = Array.from(document.querySelectorAll('input[type="email"]'));
    const phoneInputs = Array.from(document.querySelectorAll('input[type="tel"]'));
    const emailInput = emailInputs[emailInputs.length - 1];
    const phoneInput = phoneInputs[phoneInputs.length - 1];

    // Read the actual DOM property first. This works for normal typing,
    // browser autofill and password-manager autofill.
    const rawEmail = emailInput ? emailInput.value : availabilityEmail;
    const emailValue = String(rawEmail || availabilityEmail || '')
      .replace(/[\\u200B-\\u200D\\uFEFF]/g, '')
      .trim()
      .replace(/\\s+/g, '');

    const rawPhone = phoneInput ? phoneInput.value : availabilityPhone;
    const phoneValue = String(rawPhone || availabilityPhone || '').trim();

    // Keep client validation deliberately permissive. The backend performs
    // the final validation. A normal address such as name@gmail.com must pass.
    if (!emailValue || !emailValue.includes('@') || !emailValue.includes('.')) {
      return setMessage('Please enter a valid email address.');
    }

    const phoneDigits = phoneValue.replace(/\\D/g, '');
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

source = source.replace(
  "{showBooking && <BookingSheet venue={venue} action={bookingAction} date={date} setDate={setDate} event={event} setEvent={setEvent} availability={availability} checkingAvailability={checkingAvailability} submit={submit} message={message} close={closeAction}/>} ",
  "{showBooking && <BookingSheet venue={venue} action={bookingAction} date={date} setDate={setDate} event={event} setEvent={setEvent} availability={availability} checkingAvailability={checkingAvailability} availabilityEmail={availabilityEmail} setAvailabilityEmail={setAvailabilityEmail} availabilityPhone={availabilityPhone} setAvailabilityPhone={setAvailabilityPhone} availabilitySubmitted={availabilitySubmitted} setAvailabilitySubmitted={setAvailabilitySubmitted} submit={submit} message={message} close={closeAction}/>} "
);

source = source.replace(
  "function BookingSheet({venue,action,date,setDate,event,setEvent,availability,checkingAvailability,submit,message,close}) {",
  "function BookingSheet({venue,action,date,setDate,event,setEvent,availability,checkingAvailability,availabilityEmail,setAvailabilityEmail,availabilityPhone,setAvailabilityPhone,availabilitySubmitted,setAvailabilitySubmitted,submit,message,close}) {"
);

// Add contact fields once, immediately after the Event field.
if (!source.includes('availability-contact-fields')) {
  const eventField = /(<label className="input-label">Event[\\s\\S]*?<\\/label>)/;
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

// Keep the availability confirmation UI.
if (!source.includes('availability-confirmation')) {
  const actionPattern = /      <div className="booking-action-grid">[\\s\\S]*?<\\/div>/;
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
console.log('Availability form validation fixed: DOM value first, permissive client validation, backend remains final validator.');
