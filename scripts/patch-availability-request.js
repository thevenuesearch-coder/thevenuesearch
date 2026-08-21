const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src', 'App.js');
let source = fs.readFileSync(file, 'utf8');

// This patch runs after patch-frontend.js. Keep it safe to run repeatedly.
if (!source.includes("const [availabilityEmail, setAvailabilityEmail] = useState('');")) {
  source = source.replace(
    "const [checkingAvailability, setCheckingAvailability] = useState(false);",
    "const [checkingAvailability, setCheckingAvailability] = useState(false);\n  const [availabilityEmail, setAvailabilityEmail] = useState('');\n  const [availabilityPhone, setAvailabilityPhone] = useState('');\n  const [availabilitySubmitted, setAvailabilitySubmitted] = useState(false);"
  );
}

// Browser autofill can populate the visible input without updating React state.
// Always trust the live DOM value first and validate it ourselves rather than
// relying on HTMLInputElement.validity, which can be stale during autofill.
const newCheck = `  const checkAvailability = async () => {\n    if (!date) return setMessage('Please select a wedding date.');\n\n    const emailInputs = Array.from(document.querySelectorAll('.availability-contact-fields input[type="email"]'));\n    const phoneInputs = Array.from(document.querySelectorAll('.availability-contact-fields input[type="tel"]'));\n    const emailInput = emailInputs.find(input => input.offsetParent !== null) || emailInputs[0];\n    const phoneInput = phoneInputs.find(input => input.offsetParent !== null) || phoneInputs[0];\n\n    const emailValue = String(emailInput?.value || availabilityEmail || '').trim().replace(/\\s+/g, '');\n    const phoneValue = String(phoneInput?.value || availabilityPhone || '').trim();\n    const emailValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(emailValue);\n\n    if (!emailValid) return setMessage('Please enter a valid email address.');\n\n    const phoneDigits = phoneValue.replace(/\\D/g, '');\n    if (phoneDigits.length < 10 || phoneDigits.length > 15) return setMessage('Please enter a valid phone number.');\n\n    setAvailabilityEmail(emailValue);\n    setAvailabilityPhone(phoneValue);\n    setCheckingAvailability(true);\n    setMessage('');\n    setAvailabilitySubmitted(false);\n\n    try {\n      const result = await api.availability(venue.id, date);\n      setAvailability(result);\n\n      await api.requestAvailability({\n        venueId: String(venue.id),\n        venueName: String(venue.name),\n        city: String(venue.city || ''),\n        state: String(venue.state || ''),\n        date: String(date),\n        email: emailValue,\n        phone: phoneValue,\n        availabilityStatus: String(result.status || 'unknown')\n      });\n\n      setAvailabilitySubmitted(true);\n      setMessage('');\n    } catch (e) {\n      setMessage(e.message || 'Unable to submit the availability request right now.');\n    } finally {\n      setCheckingAvailability(false);\n    }\n  };`;

const start = source.indexOf('  const checkAvailability = async () => {');
if (start < 0) throw new Error('Availability check block not found.');
const end = source.indexOf('\n  };', start);
if (end < 0) throw new Error('Availability check block end not found.');
source = source.slice(0, start) + newCheck + source.slice(end + '\n  };'.length);

// Pass the availability contact state into BookingSheet.
source = source.replace(
  "{showBooking && <BookingSheet venue={venue} action={bookingAction} date={date} setDate={setDate} event={event} setEvent={setEvent} availability={availability} checkingAvailability={checkingAvailability} submit={submit} message={message} close={closeAction}/>} ",
  "{showBooking && <BookingSheet venue={venue} action={bookingAction} date={date} setDate={setDate} event={event} setEvent={setEvent} availability={availability} checkingAvailability={checkingAvailability} availabilityEmail={availabilityEmail} setAvailabilityEmail={setAvailabilityEmail} availabilityPhone={availabilityPhone} setAvailabilityPhone={setAvailabilityPhone} availabilitySubmitted={availabilitySubmitted} setAvailabilitySubmitted={setAvailabilitySubmitted} submit={submit} message={message} close={closeAction}/>} "
);

source = source.replace(
  "function BookingSheet({venue,action,date,setDate,event,setEvent,availability,checkingAvailability,submit,message,close}) {",
  "function BookingSheet({venue,action,date,setDate,event,setEvent,availability,checkingAvailability,availabilityEmail,setAvailabilityEmail,availabilityPhone,setAvailabilityPhone,availabilitySubmitted,setAvailabilitySubmitted,submit,message,close}) {"
);

const contactMarker = `      <label className="input-label">Event\\n        <select value={event} onChange={e => setEvent(e.target.value)}>\\n          <option value="All Events">All wedding events</option>\\n          <option>Main Wedding</option><option>Mehendi</option><option>Sangeet</option><option>Haldi</option><option>Reception</option>\\n        </select>\\n      </label>`;

const contactFields = `${contactMarker}\\n\\n      {action === 'availability' && !availabilitySubmitted && <div className="availability-contact-fields">\\n        <label className="input-label">Email address\\n          <input type="email" value={availabilityEmail} onInput={e => setAvailabilityEmail(e.currentTarget.value)} onChange={e => setAvailabilityEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />\\n        </label>\\n        <label className="input-label">Phone number\\n          <input type="tel" value={availabilityPhone} onInput={e => setAvailabilityPhone(e.currentTarget.value)} onChange={e => setAvailabilityPhone(e.target.value)} placeholder="10-digit mobile number" autoComplete="tel" inputMode="tel" required />\\n        </label>\\n      </div>}`;

if (!source.includes('availability-contact-fields')) {
  if (!source.includes(contactMarker)) throw new Error('Booking event field block not found.');
  source = source.replace(contactMarker, contactFields);
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

const oldActions = `      <div className="booking-action-grid">\\n        <button className="outline-button wide" onClick={() => submit('availability')} disabled={checkingAvailability}>{checkingAvailability ? 'Checking…' : 'Check availability'}</button>\\n        <button className="outline-button wide" onClick={() => submit('book')} disabled={!!availability && !availability.canBook}>Book venue</button>\\n        <button className="primary-button wide" onClick={() => submit('hold')} disabled={!!availability && !availability.canHold}>Hold this date <ArrowRight size={16}/></button>\\n      </div>`;

const newActions = `      {action === 'availability' && availabilitySubmitted ? <div className="availability-confirmation">\\n        <div className="availability-confirmation-icon"><Check size={22}/></div>\\n        <h3>Availability request submitted</h3>\\n        <p>The availability details will be shared via mail and WhatsApp.</p>\\n        <button className="primary-button wide" onClick={() => { setAvailabilitySubmitted(false); setMessage(''); setAvailability(null); }}>Done</button>\\n      </div> : <div className="booking-action-grid">\\n        <button className="outline-button wide" onClick={() => submit('availability')} disabled={checkingAvailability}>{checkingAvailability ? 'Checking…' : 'Check availability'}</button>\\n        <button className="outline-button wide" onClick={() => submit('book')} disabled={!!availability && !availability.canBook}>Book venue</button>\\n        <button className="primary-button wide" onClick={() => submit('hold')} disabled={!!availability && !availability.canHold}>Hold this date <ArrowRight size={16}/></button>\\n      </div>}`;

if (source.includes(oldActions)) source = source.replace(oldActions, newActions);

fs.writeFileSync(file, source);
console.log('Availability request workflow fixed: DOM-first autofill-safe email validation, contact capture and confirmation.');
