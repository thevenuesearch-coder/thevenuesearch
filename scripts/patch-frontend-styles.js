const fs = require('fs');
const path = require('path');

const appFile = path.join(process.cwd(), 'src', 'App.js');
let appSource = fs.readFileSync(appFile, 'utf8');

// Add the requested contact details flow to Check availability without changing
// the existing booking/holding flow. This patch is intentionally idempotent.
const bookingStart = appSource.indexOf('function BookingSheet(');
const destinationsStart = appSource.indexOf('function DestinationsPage()', bookingStart);
if (bookingStart >= 0 && destinationsStart > bookingStart && !appSource.includes('availability-contact-form')) {
  const replacement = String.raw`function BookingSheet({venue,action,date,setDate,event,setEvent,availability,checkingAvailability,submit,message,close}) {
  const available = availability?.status === 'available';
  const held = availability?.status === 'held';
  const booked = availability?.status === 'booked';
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilitySubmitting, setAvailabilitySubmitting] = useState(false);
  const [showAvailabilityConfirmation, setShowAvailabilityConfirmation] = useState(false);

  const submitAvailabilityRequest = async () => {
    setAvailabilityError('');
    if (!date) return setAvailabilityError('Please select a wedding date.');
    if (!/^\\S+@\\S+\\.\\S+$/.test(contactEmail.trim())) return setAvailabilityError('Please enter a valid email address.');
    const phoneDigits = contactPhone.replace(/\\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) return setAvailabilityError('Please enter a valid phone number.');

    setAvailabilitySubmitting(true);
    try {
      const result = await api.availability(venue.id, date);
      if (result?.status) {
        // Keep the availability status visible in the sheet after the request.
        // A best-effort enquiry is also recorded for the venue team.
        try {
          await api.createEnquiry({
            venueId: String(venue.id),
            venueName: String(venue.name),
            date: String(date),
            email: contactEmail.trim(),
            phone: contactPhone.trim(),
            eventType: event,
            availabilityStatus: result.status,
            source: 'venue-availability'
          });
        } catch (_) {
          // The user-facing confirmation should not fail if enquiry storage/email
          // is temporarily unavailable. Availability itself was checked successfully.
        }
        setShowAvailabilityConfirmation(true);
      } else {
        setAvailabilityError('We could not confirm availability right now. Please try again.');
      }
    } catch (e) {
      setAvailabilityError(e.message || 'Unable to check availability right now.');
    } finally {
      setAvailabilitySubmitting(false);
    }
  };

  if (action === 'availability') {
    return <div className="sheet-backdrop booking-backdrop" onClick={close}>
      <div className="booking-sheet availability-contact-form" role="dialog" aria-modal="true" aria-label="Check venue availability" onClick={e => e.stopPropagation()}>
        <div className="sheet-head">
          <div><span className="eyebrow">CHECK AVAILABILITY</span><h2>{venue.name}</h2><p className="sheet-subtitle">Tell us your date and contact details.</p></div>
          <button className="icon-button" onClick={close} aria-label="Close"><X/></button>
        </div>

        <label className="input-label date-field-label">Wedding date
          <div className="date-input-wrap">
            <CalendarDays size={18}/>
            <input type="date" value={date} min={new Date().toISOString().slice(0,10)} onChange={e => { setDate(e.target.value); setAvailabilityError(''); }} aria-label="Wedding date" />
          </div>
        </label>

        <label className="input-label">Email address
          <input type="email" value={contactEmail} onChange={e => { setContactEmail(e.target.value); setAvailabilityError(''); }} placeholder="you@example.com" autoComplete="email" required />
        </label>

        <label className="input-label">Phone number
          <input type="tel" value={contactPhone} onChange={e => { setContactPhone(e.target.value); setAvailabilityError(''); }} placeholder="+91 98765 43210" inputMode="tel" autoComplete="tel" required />
        </label>

        <div className="hold-selected-venue"><span>Selected venue</span><b>{venue.name}</b><small>{venue.city} · {money(venue.price)}</small></div>

        {availabilityError && <div className="notice error">{availabilityError}</div>}

        <button className="primary-button wide" onClick={submitAvailabilityRequest} disabled={availabilitySubmitting}>
          {availabilitySubmitting ? 'Checking availability…' : 'Submit & check availability'} <ArrowRight size={16}/>
        </button>
        <small className="booking-hint">We will use these details to send the availability information to you.</small>

        {showAvailabilityConfirmation && <div className="availability-confirmation-backdrop" role="presentation">
          <div className="availability-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="availability-confirmation-title">
            <div className="availability-confirmation-icon"><Check size={24}/></div>
            <span className="eyebrow">REQUEST RECEIVED</span>
            <h3 id="availability-confirmation-title">Availability request submitted</h3>
            <p>The availability details will be shared via mail and WhatsApp.</p>
            <button className="primary-button wide" onClick={() => { setShowAvailabilityConfirmation(false); close(); }}>Done</button>
          </div>
        </div>}
      </div>
    </div>;
  }

  return <div className="sheet-backdrop booking-backdrop" onClick={close}>
    <div className="booking-sheet" role="dialog" aria-modal="true" aria-label="Venue booking actions" onClick={e => e.stopPropagation()}>
      <div className="sheet-head">
        <div><span className="eyebrow">VENUE ACTIONS</span><h2>{venue.name}</h2><p className="sheet-subtitle">Select your date, then check or secure it.</p></div>
        <button className="icon-button" onClick={close} aria-label="Close"><X/></button>
      </div>

      <label className="input-label date-field-label">Wedding date
        <div className="date-input-wrap">
          <CalendarDays size={18}/>
          <input type="date" value={date} min={new Date().toISOString().slice(0,10)} onChange={e => { setDate(e.target.value); setMessage(''); setAvailability(null); }} aria-label="Wedding date" />
        </div>
      </label>

      <label className="input-label">Event
        <select value={event} onChange={e => setEvent(e.target.value)}>
          <option value="All Events">All wedding events</option>
          <option>Main Wedding</option><option>Mehendi</option><option>Sangeet</option><option>Haldi</option><option>Reception</option>
        </select>
      </label>

      <div className="hold-selected-venue"><span>Selected venue</span><b>{venue.name}</b><small>{venue.city} · {money(venue.price)}</small></div>
      <div className="hold-summary"><div><span>Venue price</span><b>{money(venue.price)}</b></div><div><span>Refundable hold amount</span><b>{money(holdFee(venue.price))}</b></div><small>This holding amount is refundable. There is no hold-duration rule in the venue workflow.</small></div>

      {availability && <div className={"availability-status " + (available ? 'available' : held ? 'held' : 'booked')}><span className="status-dot"/><b>{available ? 'Available' : held ? 'On hold' : 'Booked'}</b><span>· {date}</span></div>}
      {message && <div className={"notice " + (booked ? 'error' : '')}>{message}</div>}

      <div className="booking-action-grid">
        <button className="outline-button wide" onClick={() => submit('availability')} disabled={checkingAvailability}>{checkingAvailability ? 'Checking…' : 'Check availability'}</button>
        <button className="outline-button wide" onClick={() => submit('book')} disabled={!!availability && !availability.canBook}>Book venue</button>
        <button className="primary-button wide" onClick={() => submit('hold')} disabled={!!availability && !availability.canHold}>Hold this date <ArrowRight size={16}/></button>
      </div>

      {!availability && <small className="booking-hint">Select a date and check availability before securing it.</small>}
      {available && <small className="booking-hint">Available: you can book it or place a refundable hold.</small>}
      {held && <small className="booking-hint">Held: another customer can still book this date, but nobody else can place another hold.</small>}
      {booked && <small className="booking-hint">Booked: this date is unavailable for both booking and holding.</small>}
    </div>
  </div>;
}

`;

  appSource = appSource.slice(0, bookingStart) + replacement + appSource.slice(destinationsStart);
  fs.writeFileSync(appFile, appSource);
}

const stylesFile = path.join(process.cwd(), 'src', 'styles.css');
let styles = fs.readFileSync(stylesFile, 'utf8');
const marker = '/* Venue Search booking actions patch */';
const css = `

${marker}
/* Venue action bar: stays visible without covering page content. */
.sticky-cta{
  position:sticky!important;
  bottom:0!important;
  left:auto!important;
  right:auto!important;
  width:100%!important;
  z-index:25!important;
  display:flex!important;
  justify-content:space-between!important;
  align-items:center!important;
  gap:22px!important;
  padding:14px 18px!important;
  margin:34px 0 0!important;
  background:rgba(7,13,22,.97)!important;
  border:1px solid rgba(47,114,255,.28)!important;
  border-radius:18px 18px 0 0!important;
  box-shadow:0 -12px 35px rgba(0,0,0,.28)!important;
}
.sticky-price{min-width:150px;display:grid!important;gap:3px!important}
.sticky-price small{font-size:9px!important;color:#8fa2ba!important}
.sticky-price b{font-size:16px!important;color:#fff!important}
.sticky-cta-actions{display:grid!important;grid-template-columns:repeat(3,minmax(170px,1fr));gap:10px!important;align-items:center!important;flex:1!important;max-width:760px!important}
.sticky-cta-actions .outline-button,.sticky-cta-actions .primary-button{width:100%!important;min-height:48px!important;margin:0!important}

/* Bottom-sheet dialog: the whole sheet scrolls, and always opens at the top. */
.booking-backdrop{
  position:fixed!important;
  inset:0!important;
  z-index:200!important;
  display:flex!important;
  align-items:flex-end!important;
  justify-content:center!important;
  padding:18px!important;
  background:rgba(0,0,0,.68)!important;
  overflow:hidden!important;
}
.booking-sheet{
  width:min(680px,100%)!important;
  max-height:min(88dvh,820px)!important;
  overflow-y:auto!important;
  overscroll-behavior:contain!important;
  -webkit-overflow-scrolling:touch!important;
  padding:26px!important;
  margin:0!important;
  border:1px solid rgba(47,114,255,.35)!important;
  border-radius:22px!important;
  background:#0a1019!important;
  box-shadow:0 24px 90px rgba(0,0,0,.62)!important;
  scrollbar-width:thin!important;
}
.booking-sheet::-webkit-scrollbar{width:7px}
.booking-sheet::-webkit-scrollbar-thumb{background:rgba(47,114,255,.45);border-radius:10px}
.booking-sheet .sheet-head{position:sticky!important;top:-26px!important;z-index:4!important;margin:-26px -26px 18px!important;padding:20px 26px 16px!important;background:rgba(10,16,25,.98)!important;border-bottom:1px solid rgba(56,119,207,.18)!important}
.booking-sheet .sheet-head h2{color:#fff!important;margin:6px 0 4px!important}
.sheet-subtitle{margin:0!important;color:#9aaac0!important;font-size:11px!important}

/* Consistent calendar/date control everywhere. Native browser calendar opens on click. */
.date-field-label{gap:7px!important}
.date-input-wrap{display:flex!important;align-items:center!important;gap:10px!important;padding:11px 12px!important;border:1px solid rgba(54,119,200,.42)!important;border-radius:10px!important;background:#07101a!important;color:#28c8ef!important}
.date-input-wrap input[type="date"]{width:100%!important;min-width:0!important;background:transparent!important;color:#fff!important;border:0!important;outline:0!important;padding:2px 0!important;cursor:pointer!important;color-scheme:dark!important}
input[type="date"]{cursor:pointer!important;color-scheme:dark!important;min-height:42px!important}
input[type="date"]::-webkit-calendar-picker-indicator{opacity:.95!important;cursor:pointer!important;filter:none!important;width:18px!important;height:18px!important}
.booking-sheet .input-label{display:grid!important;gap:7px!important}
.booking-sheet .input-label input,.booking-sheet .input-label select{min-height:42px!important;padding:9px 10px!important;border:1px solid rgba(54,119,200,.42)!important;border-radius:10px!important}

.availability-status{display:flex;align-items:center;gap:7px;margin-top:14px;padding:11px 13px;border-radius:10px;font-size:11px;border:1px solid rgba(56,119,207,.3);background:#07111d}
.availability-status.available{color:#5fe3a4;border-color:rgba(50,210,145,.35)}
.availability-status.held{color:#ffd37a;border-color:rgba(255,190,70,.35)}
.availability-status.booked{color:#ff8c9b;border-color:rgba(255,80,110,.35)}
.status-dot{width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block}
.booking-action-grid{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;margin-top:16px!important}
.booking-action-grid button{min-height:48px!important;margin:0!important}
.booking-hint{display:block!important;margin-top:11px!important;color:#9aaac0!important;line-height:1.5!important}

/* Availability contact form and confirmation popup. */
.availability-contact-form{position:relative!important}
.availability-confirmation-backdrop{position:fixed!important;inset:0!important;z-index:260!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:rgba(0,0,0,.72)!important}
.availability-confirmation{width:min(440px,100%)!important;padding:30px!important;border:1px solid rgba(47,114,255,.42)!important;border-radius:20px!important;background:#0b111b!important;box-shadow:0 25px 90px rgba(0,0,0,.7)!important;text-align:center!important}
.availability-confirmation-icon{width:52px!important;height:52px!important;margin:0 auto 14px!important;border-radius:50%!important;display:grid!important;place-items:center!important;color:#5fe3a4!important;background:rgba(50,210,145,.1)!important;border:1px solid rgba(50,210,145,.35)!important}
.availability-confirmation h3{margin:10px 0 8px!important;color:#fff!important;font-size:22px!important}
.availability-confirmation p{margin:0 0 22px!important;color:#a9b7c9!important;font-size:13px!important;line-height:1.6!important}

/* Keep other date fields consistent across search, wedding planner and budget calculator. */
.wedding-planner-bar input[type="date"],.calc-control input[type="date"],.search-field input[type="date"]{cursor:pointer!important;color-scheme:dark!important}

@media(max-width:900px){
  .sticky-cta{align-items:stretch!important;flex-direction:column!important;gap:10px!important;padding:12px!important}
  .sticky-price{width:100%!important}
  .sticky-cta-actions{width:100%!important;max-width:none!important;grid-template-columns:1fr!important}
}
@media(max-width:640px){
  .booking-backdrop{padding:0!important}
  .booking-sheet{width:100%!important;max-height:94dvh!important;border-radius:22px 22px 0 0!important;padding:22px 18px 28px!important}
  .booking-sheet .sheet-head{top:-22px!important;margin:-22px -18px 18px!important;padding:18px!important}
  .booking-sheet .sheet-head h2{font-size:23px!important}
  .sticky-cta{border-radius:14px 14px 0 0!important}
}
`;

// Keep the file idempotent: replace the previous generated block if it exists.
const markerIndex = styles.indexOf(marker);
if (markerIndex >= 0) {
  styles = styles.slice(0, markerIndex).trimEnd() + css;
} else {
  styles += css;
}
fs.writeFileSync(stylesFile, styles);
console.log('Venue Search booking/calendar/availability styles applied.');
