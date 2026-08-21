const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src', 'App.js');
let source = fs.readFileSync(file, 'utf8');

// Remove the blue destination shortcut tags from the Destinations page.
source = source.replace(/\n\s*<div className="destination-pin-list">[\s\S]*?<\/div>\n\s*<a className="primary-button" href=\{googleEarthUrl\}/, '\n\n            <a className="primary-button" href={googleEarthUrl}');

const start = source.indexOf('function VenuePage({ user, setUser, saved, toggleSave }) {');
const end = source.indexOf('function DestinationsPage() {', start);
if (start === -1 || end === -1) throw new Error('VenuePage boundaries were not found.');

const replacement = String.raw`function VenuePage({ user, saved, toggleSave }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(fallbackVenues.find(v => v.id === id) || fallbackVenues[0]);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingAction, setBookingAction] = useState('availability');
  const [date, setDate] = useState('');
  const [event, setEvent] = useState('Main Wedding');
  const [message, setMessage] = useState('');
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const isSaved = saved.includes(venue.id);

  useEffect(() => { api.venue(id).then(d => d.venue && setVenue(d.venue)).catch(() => {}); }, [id]);

  const openAction = (action) => {
    setBookingAction(action);
    setMessage('');
    setAvailability(null);
    setShowBooking(true);
  };

  const checkAvailability = async () => {
    if (!date) return setMessage('Please select a wedding date.');
    setCheckingAvailability(true);
    setMessage('');
    try {
      const result = await api.availability(venue.id, date);
      setAvailability(result);
      if (result.status === 'available') setMessage('This venue is available for your selected date.');
      else if (result.status === 'held') setMessage('This date is currently on hold. It can still be booked, but it cannot be held again.');
      else setMessage('This date is already booked. Other users cannot book or hold it.');
    } catch (e) {
      setMessage(e.message || 'Unable to check availability right now.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const submit = async (action = bookingAction) => {
    if (!date) return setMessage('Please select a wedding date.');
    if (action === 'availability') return checkAvailability();
    if (!user || !localStorage.getItem('vs_token')) {
      navigate('/login', { state: { from: \`/venues/${id}\` } });
      return;
    }
    try {
      const payload = {
        venueId: String(venue.id),
        venueName: String(venue.name),
        date: String(date),
        eventType: event
      };
      const current = availability || await api.availability(venue.id, date);
      setAvailability(current);
      if (action === 'hold' && !current.canHold) return setMessage('This date cannot be held because it is already booked or currently held.');
      if (action === 'book' && !current.canBook) return setMessage('This date is already booked. Please choose another date.');
      const result = action === 'book'
        ? await api.createBooking(localStorage.getItem('vs_token'), payload)
        : await api.createHold(localStorage.getItem('vs_token'), payload);
      setMessage(result.message || (action === 'book' ? 'Venue booked successfully.' : 'Your refundable venue hold has been created.'));
      setBookingAction(action);
    } catch (e) {
      setMessage(e.message || 'Unable to complete this request.');
    }
  };

  return <main className="venue-detail">
    <div className="detail-gallery">
      <button className="back-button" onClick={() => navigate(-1)}><ArrowLeft/></button>
      <img src={venue.image} alt={venue.name}/>
      <button className={\`gallery-save \${isSaved ? 'saved' : ''}\`} onClick={() => toggleSave(venue.id)}><Heart fill={isSaved ? 'currentColor' : 'none'}/></button>
    </div>
    <div className="detail-body">
      <div className="detail-title-row"><div><span className="eyebrow">VERIFIED VENUE · {venue.mode}</span><h1>{venue.name}</h1><p className="location-line"><MapPin size={15}/>{venue.city}, {venue.state}</p></div><span className="detail-rating"><Star size={14} fill="currentColor"/>{venue.rating}<small>({venue.reviews})</small></span></div>
      <p className="detail-description">{venue.description}</p>
      <div className="detail-stats"><Stat icon={Users} value={\`\${venue.capacity}\`} label="Guests"/><Stat icon={WalletCards} value={money(venue.price)} label="Starting from"/><Stat icon={Clock3} value="Refundable hold" label="Hold option"/></div>
      <div className="detail-section"><h2>Why couples choose it</h2><div className="amenity-grid">{['Verified capacity','Transparent pricing','Real venue photos','Date availability','Wedding support','Refundable hold'].map(x=><div key={x}><Check size={15}/>{x}</div>)}</div></div>
      <div className="detail-section"><h2>Good to know</h2><p>Check live availability first. An available date can be booked or placed on a refundable hold. A held date can still be booked by another customer, but it cannot be held again. Once booked, the date cannot be booked or held by anyone else.</p></div>
      <div className="sticky-cta">
        <div><small>Starting from</small><b>{money(venue.price)}</b></div>
        <div className="sticky-cta-actions">
          <button className="outline-button" onClick={() => openAction('availability')}>Check availability</button>
          <button className="outline-button" onClick={() => openAction('book')}>Book venue</button>
          <button className="primary-button" onClick={() => openAction('hold')}>Hold this date</button>
        </div>
      </div>
    </div>
    {showBooking && <BookingSheet venue={venue} date={date} setDate={setDate} event={event} setEvent={setEvent} availability={availability} checkingAvailability={checkingAvailability} submit={submit} message={message} close={() => setShowBooking(false)}/>}
  </main>;
}

function Stat({icon:Icon,value,label}) { return <div><Icon size={18}/><b>{value}</b><span>{label}</span></div>; }

function BookingSheet({venue,date,setDate,event,setEvent,availability,checkingAvailability,submit,message,close}) {
  const available = availability?.status === 'available';
  const held = availability?.status === 'held';
  return <div className="sheet-backdrop" onClick={close}><div className="booking-sheet" onClick={e => e.stopPropagation()}>
    <div className="sheet-head"><div><span className="eyebrow">VENUE ACTIONS</span><h2>{venue.name}</h2></div><button className="icon-button" onClick={close}><X/></button></div>
    <label className="input-label">Wedding date<input type="date" value={date} onChange={e => { setDate(e.target.value); setMessage(''); }} /></label>
    <label className="input-label">Event<select value={event} onChange={e => setEvent(e.target.value)}><option value="All Events">All wedding events</option><option>Main Wedding</option><option>Mehendi</option><option>Sangeet</option><option>Haldi</option><option>Reception</option></select></label>
    {availability && <div className={\`notice \${available ? '' : 'error'}\`}><b>{available ? 'Available' : held ? 'On hold' : 'Booked'}</b> · {date}</div>}
    <div className="hold-selected-venue"><span>Selected venue</span><b>{venue.name}</b><small>{venue.city} · {money(venue.price)}</small></div>
    <div className="hold-summary"><div><span>Venue price</span><b>{money(venue.price)}</b></div><div><span>Refundable hold amount</span><b>{money(holdFee(venue.price))}</b></div><small>This hold amount is refundable. There is no hold-duration rule in the venue workflow.</small></div>
    {message && <div className="notice">{message}</div>}
    <div className="booking-action-grid">
      <button className="outline-button wide" onClick={() => submit('availability')} disabled={checkingAvailability}>{checkingAvailability ? 'Checking…' : 'Check availability'}</button>
      <button className="outline-button wide" onClick={() => submit('book')} disabled={!!availability && !availability.canBook}>Book venue</button>
      <button className="primary-button wide" onClick={() => submit('hold')} disabled={!!availability && !availability.canHold}>Hold this date <ArrowRight size={16}/></button>
    </div>
    {!availability && <small className="booking-hint">Check availability before booking or holding your date.</small>}
    {available && <small className="booking-hint">Available: you can book it or place a refundable hold.</small>}
    {held && <small className="booking-hint">This date is held, but another customer can still book it. A second hold is not allowed.</small>}
  </div></div>;
}

`;

source = source.slice(0, start) + replacement + source.slice(end);
fs.writeFileSync(file, source);
console.log('Venue Search frontend production patch applied.');
