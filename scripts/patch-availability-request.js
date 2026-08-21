const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src', 'App.js');
let source = fs.readFileSync(file, 'utf8');

// Add contact fields used only for the Check availability request.
if (!source.includes("const [availabilityEmail, setAvailabilityEmail] = useState('');")) {
  source = source.replace(
    "const [checkingAvailability, setCheckingAvailability] = useState(false);",
    "const [checkingAvailability, setCheckingAvailability] = useState(false);\n  const [availabilityEmail, setAvailabilityEmail] = useState('');\n  const [availabilityPhone, setAvailabilityPhone] = useState('');\n  const [availabilitySubmitted, setAvailabilitySubmitted] = useState(false);"
  );
}

// Replace the availability check with DOM-first value handling. This is important
// because Chrome/Google autofill can populate a controlled input without firing
// React's onChange event. The visible input value must always win over stale state.
const newCheck = `  const checkAvailability = async () => {\n    if (!date) return setMessage('Please select a wedding date.');\n    const emailInput = document.querySelector('.availability-contact-fields input[type="email"]');\n    const phoneInput = document.querySelector('.availability-contact-fields input[type="tel"]');\n    const emailValue = String(emailInput?.value || availabilityEmail || '').trim().replace(/\\s+/g, '');\n    const phoneValue = String(phoneInput?.value || availabilityPhone || '').trim();\n    const emailValid = emailInput ? emailInput.validity.valid && emailValue.includes('@') && emailValue.includes('.') : /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(emailValue);\n    if (!emailValid) return setMessage('Please enter a valid email address.');\n    const phoneDigits = phoneValue.replace(/\\D/g, '');\n    if (phoneDigits.length < 10 || phoneDigits.length > 15) return setMessage('Please enter a valid phone number.');\n    setAvailabilityEmail(emailValue);\n    setAvailabilityPhone(phoneValue);\n    setCheckingAvailability(true);\n    setMessage('');\n    setAvailabilitySubmitted(false);\n    try {\n      const result = await api.availability(venue.id, date);\n      setAvailability(result);\n      await api.requestAvailability({\n        venueId: String(venue.id),\n        venueName: String(venue.name),\n        city: String(venue.city || ''),\n        state: String(venue.state || ''),\n        date: String(date),\n        email: emailValue,\n        phone: phoneValue,\n        availabilityStatus: String(result.status || 'unknown')\n      });\n      setAvailabilitySubmitted(true);\n    } catch (e) {\n      setMessage(e.message || 'Unable to submit the availability request right now.');\n    } finally {\n      setCheckingAvailability(false);\n    }\n  };`;

const oldCheck = `  const checkAvailability = async () => {\n    if (!date) return setMessage('Please select a wedding date.');\n    setCheckingAvailability(true);\n    setMessage('');\n    try {\n      const result = await api.availability(venue.id, date);\n      setAvailability(result);\n      if (result.status === 'available') setMessage('This venue is available for your selected date.');\n      else if (result.status === 'held') setMessage('This date is currently on hold. It can still be booked, but it cannot be held again.');\n      else setMessage('This date is already booked. Other users cannot book or hold it.');\n    } catch (e) {\n      setMessage(e.message || 'Unable to check availability right now.');\n    } finally {\n      setCheckingAvailability(false);\n    }\n  };`;

if (source.includes(oldCheck)) {
  source = source.replace(oldCheck, newCheck);
} else {
  const start = source.indexOf('  const checkAvailability = async () => {');
  const end = start >= 0 ? source.indexOf('\n  };', start) : -1;
  if (start < 0 || end < 0) throw new Error('Availability check block not found.');
  source = source.slice(0, start) + newCheck.trimEnd() + source.slice(end + '\n  };'.length);
}

source = source.replace(
  "{showBooking && <BookingSheet venue={venue} action={bookingAction} date={date} setDate={setDate} event={event} setEvent={setEvent} availability={availability} checkingAvailability={checkingAvailability} submit={submit} message={message} close={closeAction}/>} ",
  "{showBooking && <BookingSheet venue={venue} action={bookingAction} date={date} setDate={setDate} event={event} setEvent={setEvent} availability={availability} checkingAvailability={checkingAvailability} availabilityEmail={availabilityEmail} setAvailabilityEmail={setAvailabilityEmail} availabilityPhone={availabilityPhone} setAvailabilityPhone={setAvailabilityPhone} availabilitySubmitted={availabilitySubmitted} setAvailabilitySubmitted={setAvailabilitySubmitted} submit={submit} message={message} close={closeAction}/>} "
);

source = source.replace(
  "function BookingSheet({venue,action,date,setDate,event,setEvent,availability,checkingAvailability,submit,message,close}) {",
  "function BookingSheet({venue,action,date,setDate,event,setEvent,availability,checkingAvailability,availabilityEmail,setAvailabilityEmail,availabilityPhone,setAvailabilityPhone,availabilitySubmitted,setAvailabilitySubmitted,submit,message,close}) {"
);

const contactMarker = `      <label className="input-label">Event\n        <select value={event} onChange={e => setEvent(e.target.value)}>\n          <option value="All Events">All wedding events</option>\n          <option>Main Wedding</option><option>Mehendi</option><option>Sangeet</option><option>Haldi</option><option>Reception</option>\n        </select>\n      </label>`;

const contactFields = `${contactMarker}\n\n      {action === 'availability' && !availabilitySubmitted && <div className="availability-contact-fields">\n        <label className="input-label">Email address\n          <input type="email" value={availabilityEmail} onChange={e => setAvailabilityEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />\n        </label>\n        <label className="input-label">Phone number\n          <input type="tel" value={availabilityPhone} onChange={e => setAvailabilityPhone(e.target.value)} placeholder="10-digit mobile number" autoComplete="tel" inputMode="tel" />\n        </label>\n      </div>}`;

if (!source.includes('availability-contact-fields')) {
  if (!source.includes(contactMarker)) throw new Error('Booking event field block not found.');
  source = source.replace(contactMarker, contactFields);
}

const oldActions = `      <div className="booking-action-grid">\n        <button className="outline-button wide" onClick={() => submit('availability')} disabled={checkingAvailability}>{checkingAvailability ? 'Checking…' : 'Check availability'}</button>\n        <button className="outline-button wide" onClick={() => submit('book')} disabled={!!availability && !availability.canBook}>Book venue</button>\n        <button className="primary-button wide" onClick={() => submit('hold')} disabled={!!availability && !availability.canHold}>Hold this date <ArrowRight size={16}/></button>\n      </div>`;

const newActions = `      {action === 'availability' && availabilitySubmitted ? <div className="availability-confirmation">\n        <div className="availability-confirmation-icon"><Check size={22}/></div>\n        <h3>Availability request submitted</h3>\n        <p>The availability details will be shared via mail and WhatsApp.</p>\n        <button className="primary-button wide" onClick={() => { setAvailabilitySubmitted(false); setMessage(''); setAvailability(null); }}>Done</button>\n      </div> : <div className="booking-action-grid">\n        <button className="outline-button wide" onClick={() => submit('availability')} disabled={checkingAvailability}>{checkingAvailability ? 'Checking…' : 'Check availability'}</button>\n        <button className="outline-button wide" onClick={() => submit('book')} disabled={!!availability && !availability.canBook}>Book venue</button>\n        <button className="primary-button wide" onClick={() => submit('hold')} disabled={!!availability && !availability.canHold}>Hold this date <ArrowRight size={16}/></button>\n      </div>`;

if (source.includes(oldActions)) source = source.replace(oldActions, newActions);

fs.writeFileSync(file, source);
console.log('Availability contact workflow updated with DOM-first email validation.');
