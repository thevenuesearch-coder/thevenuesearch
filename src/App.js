import './styles.css';
import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, Navigate, useLocation, useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, Filter, Heart,
  Home, MapPin, Menu, Search, SlidersHorizontal, Sparkles, Star, UserRound,
  Users, X, MessageCircle, ShieldCheck, Clock3, WalletCards, Crown, Navigation, Plus, GitCompare, LogOut, Settings, ClipboardList, UserCircle
} from "lucide-react";
import { api } from "./api";
import { collections, destinations, inspiration } from "./data";

const fallbackVenues = [
  {
    id: "udaipur-palace",
    name: "The Lake Palace Estate",
    city: "Udaipur",
    state: "Rajasthan",
    price: 1800000,
    capacity: 450,
    rating: 4.9,
    reviews: 86,
    type: "Palace",
    mode: "Instant Hold",
    verified: true,
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=88",
    tags: ["Lake View", "Luxury", "Rooms"],
    description: "A grand lakeside setting designed for multi-day destination celebrations, with palace architecture, intimate courtyards and panoramic water views."
  },
  {
    id: "udaipur-garden",
    name: "Aravalli Garden Retreat",
    city: "Udaipur",
    state: "Rajasthan",
    price: 950000,
    capacity: 250,
    rating: 4.8,
    reviews: 54,
    type: "Resort",
    mode: "Instant Hold",
    verified: true,
    image: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1400&q=88",
    tags: ["Garden", "Mountain View", "Pool"],
    description: "A relaxed luxury resort surrounded by the Aravallis, ideal for intimate ceremonies, cocktail evenings and vibrant mehendi celebrations."
  },
  {
    id: "udaipur-lake-house",
    name: "The Lakeview Courtyard",
    city: "Udaipur",
    state: "Rajasthan",
    price: 650000,
    capacity: 180,
    rating: 4.7,
    reviews: 39,
    type: "Boutique",
    mode: "Instant Book",
    verified: true,
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=88",
    tags: ["Intimate", "Lake View", "Boutique"],
    description: "A private-feeling boutique venue for couples who want an elegant celebration without the scale of a large palace wedding."
  },
  {
    id: "jaipur-heritage",
    name: "Pink City Heritage Haveli",
    city: "Jaipur",
    state: "Rajasthan",
    price: 1100000,
    capacity: 300,
    rating: 4.8,
    reviews: 61,
    type: "Heritage",
    mode: "Instant Hold",
    verified: true,
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1400&q=88",
    tags: ["Heritage", "Courtyard", "Luxury"],
    description: "A character-rich Jaipur haveli with courtyards, terraces and heritage details for traditional Indian celebrations."
  },
  {
    id: "goa-coast",
    name: "Coco Palm Beach Resort",
    city: "Goa",
    state: "Goa",
    price: 1250000,
    capacity: 350,
    rating: 4.9,
    reviews: 72,
    type: "Beach Resort",
    mode: "Instant Hold",
    verified: true,
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=88",
    tags: ["Beach", "Rooms", "Pool"],
    description: "A tropical celebration venue with beachfront ceremony spaces, open-air dining and a relaxed destination wedding atmosphere."
  },
  {
    id: "kerala-backwater",
    name: "Backwater Banyan Retreat",
    city: "Alleppey",
    state: "Kerala",
    price: 780000,
    capacity: 220,
    rating: 4.8,
    reviews: 44,
    type: "Resort",
    mode: "Instant Book",
    verified: true,
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1400&q=88",
    tags: ["Backwaters", "Garden", "Intimate"],
    description: "A lush backwater retreat for couples looking for a slower, deeply scenic celebration with Kerala-inspired hospitality."
  },
  {id:"jaipur-royal-garden",name:"Amber Garden Palace",city:"Jaipur",state:"Rajasthan",price:1450000,capacity:380,rating:4.8,reviews:48,type:"Palace",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&q=88",tags:["Courtyard","Royal","Garden"],description:"A royal Jaipur setting with open courtyards and elegant gardens for multi-day celebrations."},
  {id:"jaipur-pink-resort",name:"Pink City Courtyard Resort",city:"Jaipur",state:"Rajasthan",price:820000,capacity:240,rating:4.7,reviews:35,type:"Resort",mode:"Instant Book",verified:true,image:"https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=88",tags:["Pool","Courtyard","Rooms"],description:"A relaxed resort with a traditional Jaipur character and flexible event spaces."},
  {id:"jaipur-haveli",name:"Royal Haveli House",city:"Jaipur",state:"Rajasthan",price:690000,capacity:160,rating:4.7,reviews:27,type:"Heritage",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1520637836862-4d197d17c90a?auto=format&fit=crop&w=1400&q=88",tags:["Heritage","Intimate","Terrace"],description:"An intimate heritage house for elegant family-led celebrations."},
  {id:"goa-lagoon",name:"Azure Lagoon Resort",city:"Goa",state:"Goa",price:980000,capacity:280,rating:4.8,reviews:51,type:"Beach Resort",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=88",tags:["Beach","Pool","Sunset"],description:"A coastal venue with sunset lawns and private event spaces."},
  {id:"goa-palm",name:"Palm Grove Celebration House",city:"Goa",state:"Goa",price:720000,capacity:190,rating:4.7,reviews:31,type:"Boutique",mode:"Instant Book",verified:true,image:"https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=88",tags:["Palm Grove","Intimate","Beach"],description:"A boutique tropical venue for intimate destination weddings."},
  {id:"goa-cliff",name:"Cabo Sunset Estate",city:"Goa",state:"Goa",price:1550000,capacity:420,rating:4.9,reviews:67,type:"Luxury Resort",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=88",tags:["Cliffside","Sunset","Luxury"],description:"A dramatic coastal estate for large luxury celebrations."},
  {id:"kerala-houseboat",name:"Vembanad Lake Retreat",city:"Kerala",state:"Kerala",price:840000,capacity:220,rating:4.8,reviews:38,type:"Resort",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1400&q=88",tags:["Backwaters","Lake","Garden"],description:"A tranquil backwater resort with scenic ceremony lawns."},
  {id:"kerala-palms",name:"Coconut Grove Estate",city:"Kerala",state:"Kerala",price:610000,capacity:150,rating:4.7,reviews:25,type:"Boutique",mode:"Instant Book",verified:true,image:"https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1400&q=88",tags:["Coconut Grove","Intimate","Nature"],description:"A lush private estate for small, relaxed celebrations."},
  {id:"kerala-heritage",name:"Heritage Backwater Palace",city:"Kerala",state:"Kerala",price:1320000,capacity:360,rating:4.9,reviews:55,type:"Heritage",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=88",tags:["Heritage","Backwater","Luxury"],description:"A heritage-inspired property with elegant waterfront spaces."},
  {id:"hyderabad-palace",name:"Falaknuma Inspired Estate",city:"Hyderabad",state:"Telangana",price:1600000,capacity:400,rating:4.8,reviews:44,type:"Palace",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1400&q=88",tags:["Palace","Royal","Grand"],description:"A grand Hyderabad celebration setting inspired by the city's royal architecture."},
  {id:"hyderabad-lake",name:"Deccan Lake Resort",city:"Hyderabad",state:"Telangana",price:890000,capacity:260,rating:4.7,reviews:33,type:"Resort",mode:"Instant Book",verified:true,image:"https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1400&q=88",tags:["Lake","Garden","Rooms"],description:"A modern resort with flexible spaces for destination-style celebrations."},
  {id:"hyderabad-courtyard",name:"Deccan Courtyard House",city:"Hyderabad",state:"Telangana",price:580000,capacity:140,rating:4.6,reviews:21,type:"Boutique",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=88",tags:["Courtyard","Intimate","Modern"],description:"A stylish intimate venue for smaller celebrations."},
  {id:"udaipur-aravalli",name:"Aravalli Sunset Palace",city:"Udaipur",state:"Rajasthan",price:1380000,capacity:330,rating:4.9,reviews:63,type:"Heritage",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1606298855672-3efb63017be8?auto=format&fit=crop&w=1400&q=88",tags:["Aravalli","Sunset","Heritage"],description:"A panoramic Aravalli venue with sunset terraces and heritage architecture."},
  {id:"udaipur-garden-estate",name:"Mewar Garden Estate",city:"Udaipur",state:"Rajasthan",price:760000,capacity:210,rating:4.7,reviews:29,type:"Garden",mode:"Instant Book",verified:true,image:"https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1400&q=88",tags:["Garden","Intimate","Open Air"],description:"A garden estate for colourful ceremonies and outdoor dinners."},
  {id:"udaipur-heritage",name:"Mewar Heritage Courtyard",city:"Udaipur",state:"Rajasthan",price:1080000,capacity:280,rating:4.8,reviews:42,type:"Heritage",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=88",tags:["Heritage","Courtyard","Luxury"],description:"A heritage courtyard combining traditional details with modern guest comfort."},
];
const money = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const holdFee = (price) => Math.min(75000, Math.max(15000, Math.round(price * 0.10)));

const safeStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

function App() {
  const [saved, setSaved] = useState(() => safeStorage("vs_saved", []));
  const [user, setUser] = useState(() => safeStorage("vs_user", null));

  useEffect(() => localStorage.setItem("vs_saved", JSON.stringify(saved)), [saved]);
  const toggleSave = (id) => setSaved((s) => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <div className="app-shell">
      <Header user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage saved={saved} toggleSave={toggleSave} />} />
        <Route path="/venues/:id" element={<VenuePage user={user} setUser={setUser} saved={saved} toggleSave={toggleSave} />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/inspiration" element={<InspirationPage />} />
        <Route path="/shortlist" element={<ShortlistPage saved={saved} toggleSave={toggleSave} />} />
        <Route path="/your-wedding" element={user ? <WeddingPage user={user} setUser={setUser} /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthPage setUser={setUser} />} />
        <Route path="/wedding-fit" element={<WeddingFitPage />} />
        <Route path="/date-pulse" element={<DatePulsePage />} />
        <Route path="/guest-journey" element={<GuestJourneyPage />} />
        <Route path="/budget-studio" element={<BudgetStudioPage />} />
        <Route path="/budget-calculator" element={user ? <BudgetCalculatorPage user={user} /> : <Navigate to="/login" replace />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/profile" element={user ? <ProfilePage user={user} /> : <Navigate to="/login" replace />} />
        <Route path="/my-estimations" element={user ? <EstimationsPage user={user} /> : <Navigate to="/login" replace />} />
        <Route path="/settings" element={user ? <SettingsPage user={user} setUser={setUser} /> : <Navigate to="/login" replace />} />
        <Route path="/vendor-marketplace" element={<VendorMarketplacePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

function Header({ user, setUser }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("vs_token");
    localStorage.removeItem("vs_user");
    setUser(null);
    setOpen(false);
    navigate("/login", { replace: true });
  };
  return (
    <header className="topbar">
      <Link to="/" className="brand" aria-label="Venue Search home">
        <img className="brand-logo" src="/the-venue-search-logo.png" alt="Venue Search" />
      </Link>
      <nav className="desktop-nav">
        <Link to="/explore">Explore</Link>
        <Link to="/destinations">Destinations</Link>
        <Link to="/inspiration">Inspiration</Link>
        <Link to="/your-wedding">Your Wedding</Link>
        <Link to="/wedding-fit">Wedding Fit</Link>
      </nav>
      <div className="top-actions">
        <Link className="icon-button" to="/shortlist"><Heart size={18}/></Link>
        {user ? (
          <div className="profile-menu-wrap">
            <button aria-label="Open profile menu" className="profile-button profile-trigger" onClick={() => setOpen(v => !v)}><UserRound size={17}/></button>
            {open && <div className="profile-menu">
              <div className="profile-menu-user">
                <div className="profile-avatar"><UserRound size={17}/></div>
                <div><strong>{user.name}</strong><span>{user.email}</span></div>
              </div>
              <div className="profile-menu-divider" />
              <Link onClick={() => setOpen(false)} to="/profile"><UserCircle size={17}/> Profile</Link>
              <Link onClick={() => setOpen(false)} to="/explore"><Search size={17}/> Explore</Link>
              <Link onClick={() => setOpen(false)} to="/my-estimations"><ClipboardList size={17}/> My Estimations</Link>
              <Link onClick={() => setOpen(false)} to="/settings"><Settings size={17}/> Settings</Link>
              <div className="profile-menu-divider" />
              <button className="profile-logout" onClick={logout}><LogOut size={17}/> Logout</button>
            </div>}
          </div>
        ) : (
          <Link aria-label="Login" className="profile-button" to="/login"><UserRound size={17}/></Link>
        )}
      </div>
    </header>
  );
}

function BottomNav() {
  const location = useLocation();
  const items = [
    ["/", Home, "Home"], ["/explore", Search, "Explore"], ["/shortlist", Heart, "Saved"], ["/your-wedding", UserRound, "Wedding"]
  ];
  return <div className="bottom-nav">{items.map(([to, Icon, label]) => (
    <Link key={to} className={location.pathname === to ? "active" : ""} to={to}><Icon size={19}/><span>{label}</span></Link>
  ))}</div>;
}


function SearchBar(){
  const navigate = useNavigate();
  const [destination,setDestination] = useState("");
  const [date,setDate] = useState("");
  const [guests,setGuests] = useState("200–400");
  const [budget,setBudget] = useState("Any budget");
  const [open,setOpen] = useState(null);

  const destinationNames = Array.from(new Set(destinations.map(d => d.name)));
  const totalVenues = fallbackVenues.length;
  const destinationVenueCount = destination
    ? fallbackVenues.filter(v => v.city === destination || v.state === destination).length
    : totalVenues;

  const runSearch = () => {
    const params = new URLSearchParams();
    if(destination) params.set("city", destination);
    if(date) params.set("date", date);
    if(guests) params.set("guests", guests);
    if(budget !== "Any budget") params.set("budget", budget);
    navigate(`/explore?${params.toString()}`);
  };

  return <section className="smart-strip">
    <div className="search-field custom-field">
      <MapPin size={20}/>
      <div className="search-field-content">
        <span>DESTINATION</span>
        <button className="field-trigger" onClick={()=>setOpen(open==="destination"?null:"destination")}>
          {destination || "Where to?"}
          <ChevronDown size={15}/>
        </button>
      </div>
      {open==="destination" && <div className="field-menu">
        <button onClick={()=>{setDestination("");setOpen(null)}}>All destinations</button>
        {destinationNames.map(name=><button key={name} onClick={()=>{setDestination(name);setOpen(null)}}>{name}</button>)}
      </div>}
    </div>

    <div className="search-field custom-field">
      <CalendarDays size={20}/>
      <div className="search-field-content">
        <span>DATE</span>
        <label className="date-trigger">
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} aria-label="Wedding date"/>
          <span>{date ? new Date(date+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "Select date"}</span>
          <CalendarDays size={14}/>
        </label>
      </div>
    </div>

    <div className="search-field custom-field">
      <Users size={20}/>
      <div className="search-field-content">
        <span>GUESTS</span>
        <button className="field-trigger" onClick={()=>setOpen(open==="guests"?null:"guests")}>
          {guests}<ChevronDown size={15}/>
        </button>
      </div>
      {open==="guests" && <div className="field-menu">
        {["50–100","100–200","200–400","400–600","600+"].map(x=><button key={x} onClick={()=>{setGuests(x);setOpen(null)}}>{x} guests</button>)}
      </div>}
    </div>

    <div className="search-field custom-field">
      <WalletCards size={20}/>
      <div className="search-field-content">
        <span>BUDGET</span>
        <button className="field-trigger" onClick={()=>setOpen(open==="budget"?null:"budget")}>
          {budget}<ChevronDown size={15}/>
        </button>
      </div>
      {open==="budget" && <div className="field-menu">
        {["Any budget","Under ₹8L","₹8L–₹15L","₹15L–₹25L","₹25L+"].map(x=><button key={x} onClick={()=>{setBudget(x);setOpen(null)}}>{x}</button>)}
      </div>}
    </div>

    <button className="search-submit" onClick={runSearch}>
      <Search size={18}/>
      <span>Explore <b>{destinationVenueCount}</b> venues</span>
      <ArrowRight size={17}/>
    </button>
  </section>
}
function HomePage() {
  const [city,setCity]=useState("All"),[date,setDate]=useState(""),[guests,setGuests]=useState("200–400"),[budget,setBudget]=useState("Any budget");
  const count=city==="All"?new Set(fallbackVenues.map(v=>v.city)).size:fallbackVenues.filter(v=>v.city===city).length;
  return <main className="brand-home">
    <section className="brand-hero"><div className="brand-hero-bg"/><div className="brand-hero-overlay"/><div className="brand-hero-content">
      <span className="eyebrow light"><Sparkles size={13}/> HANDPICKED DESTINATIONS</span>
      <h1>Extraordinary<br/>destinations for<br/><em>extraordinary<br/>celebrations.</em></h1>
      <p>From royal palaces to serene beaches, explore India's most enchanting wedding destinations.</p>
      <div className="hero-action-row"><Link className="earth-cta" to="/explore"><Search size={16}/> Explore venues <ArrowRight size={16}/></Link><Link className="hero-secondary" to="/wedding-fit"><Sparkles size={15}/> Find my wedding fit</Link></div>
    </div></section>
    <SearchBar/>

<section className="brand-popular section"><div className="brand-section-heading"><div><span className="eyebrow">POPULAR DESTINATIONS</span><h2>Start with the place.</h2></div><Link className="brand-outline" to="/destinations">View all <ArrowRight size={15}/></Link></div>
      <div className="brand-destination-grid">{destinations.map(d=><Link key={d.name} className="brand-destination-card" to={`/explore?city=${encodeURIComponent(d.name)}`}><img src={d.image} alt={d.name}/><div className="brand-destination-shade"/><div className="brand-destination-copy"><span>{d.label} · {fallbackVenues.filter(v=>v.city===d.name).length} venues</span><h3>{d.name}</h3></div><ArrowRight/></Link>)}</div>
    </section>

    <section className="section home-tools"><SectionHeading kicker="SMART WEDDING TOOLS" title="Everything you need, without leaving Venue Search." action="Explore all tools" to="/wedding-fit"/><div className="tool-grid">
      <HomeTool icon={Sparkles} title="Wedding Fit Score" text="Get a venue ranking around your guest count, budget and celebration style." to="/wedding-fit"/>
      <HomeTool icon={WalletCards} title="Budget Calculator" text="Estimate venue, food, rooms, travel, decor and other wedding costs." to="/budget-calculator"/>
      <HomeTool icon={CalendarDays} title="Date Pulse" text="Check your date confidence before you commit." to="/date-pulse"/>
      <HomeTool icon={Navigation} title="Guest Journey" text="Plan airport, stay, events and movement from the guest perspective." to="/guest-journey"/>
    </div></section>

    <section className="section dark-section home-venues"><SectionHeading kicker="CURATED VENUES" title="Three starting choices in every destination." action="Explore venues" to="/explore"/><div className="venue-grid">{fallbackVenues.slice(0,6).map(v=><VenueCard key={v.id} venue={v}/>)}</div></section>

    <section className="section home-how"><SectionHeading kicker="HOW IT WORKS" title="From first idea to a held date."/><div className="how-grid">{[["01","Choose a destination","Browse verified venues by destination and celebration style."],["02","Build your wedding profile","Tell us guests, dates, budget and travel origin."],["03","Compare with confidence","Use fit, date and guest-journey signals."],["04","Hold the date","Choose an event or all wedding events from the venue page."]].map(([n,t,d])=><div className="how-card" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></div>)}</div></section>

    <section className="brand-promise"><span className="eyebrow">THE VENUE SEARCH PROMISE</span><h2>Less searching.<br/><em>More celebrating.</em></h2><div className="promise-actions"><Link className="brand-outline dark" to="/your-wedding">Build your wedding <ArrowRight size={15}/></Link><Link className="brand-outline dark" to="/budget-calculator">Calculate budget <ArrowRight size={15}/></Link></div></section>
  </main>;
}
function HomeTool({icon:Icon,title,text,to}){return <Link className="home-tool" to={to}><span><Icon size={20}/></span><h3>{title}</h3><p>{text}</p><ArrowRight size={18}/></Link>;
}
function ExplorePage({ saved, toggleSave }) {
  const params = new URLSearchParams(useLocation().search);
  const [filters, setFilters] = useState({ city: params.get("city") || "All", guests: "All", type: "All", budget: "All" });
  const [showFilters, setShowFilters] = useState(false);
  const [venues, setVenues] = useState(fallbackVenues);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.venues({ city: filters.city === "All" ? "" : filters.city }).then(d => {
      if (alive && d.venues?.length) setVenues(d.venues);
    }).catch(() => {}).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [filters.city]);

  const filtered = useMemo(() => venues.filter(v =>
    (filters.city === "All" || v.city === filters.city) &&
    (filters.type === "All" || v.type === filters.type) &&
    (filters.guests === "All" || v.capacity >= Number(filters.guests)) &&
    (filters.budget === "All" || v.price <= Number(filters.budget))
  ), [venues, filters]);

  return <main className="page">
    <div className="page-head"><div><span className="eyebrow">DISCOVER</span><h1>Find your venue.</h1><p>Curated spaces for celebrations big and beautifully intimate.</p></div><button className="filter-trigger" onClick={() => setShowFilters(true)}><SlidersHorizontal size={17}/> Filters</button></div>
    <div className="chip-row">
      {["All","Udaipur","Jaipur","Goa","Kerala","Hyderabad"].map(x => <button key={x} className={filters.city === x ? "chip active" : "chip"} onClick={() => setFilters({...filters, city:x})}>{x}</button>)}
    </div>
    <div className="results-meta"><span>{filtered.length} venues</span><span>{loading ? "Updating..." : "Verified collection"}</span></div>
    <div className="venue-grid explore-grid">{filtered.map(v => <VenueCard key={v.id} venue={v} saved={saved.includes(v.id)} onSave={() => toggleSave(v.id)}/>)}</div>
    {showFilters && <FilterSheet filters={filters} setFilters={setFilters} close={() => setShowFilters(false)}/>}
  </main>;
}

function FilterSheet({ filters, setFilters, close }) {
  const update = (key, value) => setFilters({...filters, [key]:value});
  return <div className="sheet-backdrop" onClick={close}><div className="filter-sheet" onClick={e => e.stopPropagation()}>
    <div className="sheet-head"><h2>Refine your search</h2><button className="icon-button" onClick={close}><X/></button></div>
    <FilterSelect label="Venue type" value={filters.type} options={["All","Palace","Resort","Boutique","Heritage","Beach Resort"]} onChange={v => update("type",v)}/>
    <FilterSelect label="Minimum guest capacity" value={filters.guests} options={["All","100","200","300","400","500"]} onChange={v => update("guests",v)}/>
    <FilterSelect label="Maximum venue price" value={filters.budget} options={["All","500000","1000000","1500000","2000000"]} onChange={v => update("budget",v)}/>
    <button className="primary-button wide" onClick={close}>Show venues</button>
  </div></div>;
}

function FilterSelect({label,value,options,onChange}) {
  return <div className="filter-select"><label>{label}</label><div className="select-wrap"><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(x=><option key={x} value={x}>{x === "All" ? "Any" : x}</option>)}</select><ChevronDown size={16}/></div></div>;
}

function VenueCard({ venue, saved=false, onSave }) {
  return <article className="venue-card">
    <Link to={`/venues/${venue.id}`} className="venue-image-wrap"><img src={venue.image} alt={venue.name}/><span className="venue-badge"><ShieldCheck size={12}/> Verified</span>{onSave && <button className={`save-button ${saved ? "saved":""}`} onClick={e=>{e.preventDefault();onSave()}}><Heart size={17} fill={saved ? "currentColor":"none"}/></button>}</Link>
    <Link to={`/venues/${venue.id}`} className="venue-content">
      <div className="venue-top"><div><h3>{venue.name}</h3><p><MapPin size={13}/>{venue.city}, {venue.state}</p></div><span className="rating"><Star size={12} fill="currentColor"/>{venue.rating}</span></div>
      <div className="tag-row">{venue.tags?.slice(0,3).map(t=><span key={t}>{t}</span>)}</div>
      <div className="venue-bottom"><span>From <b>{money(venue.price)}</b></span><span>{venue.capacity} guests</span></div>
    </Link>
  </article>;
}

function VenuePage({ user, saved, toggleSave }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(fallbackVenues.find(v => v.id === id) || fallbackVenues[0]);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingAction, setBookingAction] = useState("availability");
  const [date, setDate] = useState("");
  const [event, setEvent] = useState("Main Wedding");
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityEmail, setAvailabilityEmail] = useState("");
  const [availabilityPhone, setAvailabilityPhone] = useState("");
  const [availabilitySubmitted, setAvailabilitySubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const isSaved = saved.includes(venue.id);

  useEffect(() => {
    api.venue(id).then(d => d.venue && setVenue(d.venue)).catch(() => {});
  }, [id]);

  const openAction = (action) => {
    setBookingAction(action);
    setMessage("");
    setAvailability(null);
    setAvailabilitySubmitted(false);
    setShowBooking(true);
    requestAnimationFrame(() => {
      const sheet = document.querySelector(".booking-sheet");
      if (sheet) sheet.scrollTop = 0;
    });
  };

  const closeAction = () => {
    setShowBooking(false);
    setMessage("");
    setAvailability(null);
    setAvailabilitySubmitted(false);
  };

  const checkAvailability = async () => {
    if (!date) return setMessage("Please select your event date.");

    const emailValue = String(availabilityEmail || "").trim().replace(/\s+/g, "");
    const phoneValue = String(availabilityPhone || "").trim();

    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailValue)) {
      return setMessage("Please enter a valid email address.");
    }

    const phoneDigits = phoneValue.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return setMessage("Please enter a valid phone number.");
    }

    setCheckingAvailability(true);
    setMessage("");

    try {
      const result = await api.availability(venue.id, date);

      await api.requestAvailability({
        venueId: String(venue.id),
        venueName: String(venue.name),
        city: String(venue.city || ""),
        state: String(venue.state || ""),
        date: String(date),
        eventType: String(event),
        email: emailValue,
        phone: phoneValue,
        availabilityStatus: String(result.status || "unknown")
      });

      setAvailability(result);
      setAvailabilitySubmitted(true);
      setMessage("");
    } catch (e) {
      setMessage(e.message || "Unable to submit the availability request right now.");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const submitSecureRequest = async (action) => {
    if (!date) return setMessage("Please select your event date.");

    if (!user || !localStorage.getItem("vs_token")) {
      navigate("/login", { state: { from: `/venues/${id}` } });
      return;
    }

    try {
      setMessage("");
      const payload = {
        venueId: String(venue.id),
        venueName: String(venue.name),
        date: String(date),
        eventType: String(event)
      };

      const current = await api.availability(venue.id, date);
      setAvailability(current);

      if (action === "hold" && !current.canHold) {
        return setMessage(
          current.status === "booked"
            ? "This date is already booked. It cannot be booked or held."
            : "This date is currently held by another customer. It can still be booked, but another hold cannot be placed."
        );
      }

      if (action === "book" && !current.canBook) {
        return setMessage("This date is already booked. Please choose another date.");
      }

      const result = action === "book"
        ? await api.createBooking(localStorage.getItem("vs_token"), payload)
        : await api.createHold(localStorage.getItem("vs_token"), payload);

      setAvailability({
        ...current,
        status: action === "book" ? "booked" : "held",
        canBook: action !== "book",
        canHold: false
      });
      setMessage(
        result.message ||
        (action === "book"
          ? `Instant booking request completed. Booking amount: ${money(holdFee(venue.price))}.`
          : `Instant holding request completed. Refundable holding amount: ${money(holdFee(venue.price))}.`)
      );
    } catch (e) {
      setMessage(e.message || "Unable to complete this request.");
    }
  };

  return <main className="venue-detail">
    <div className="detail-gallery">
      <button className="back-button" onClick={() => navigate(-1)}><ArrowLeft/></button>
      <img src={venue.image} alt={venue.name}/>
      <button className={`gallery-save ${isSaved ? "saved" : ""}`} onClick={() => toggleSave(venue.id)}><Heart fill={isSaved ? "currentColor" : "none"}/></button>
    </div>

    <div className="detail-body">
      <div className="detail-title-row">
        <div>
          <span className="eyebrow">VERIFIED VENUE · {venue.mode}</span>
          <h1>{venue.name}</h1>
          <p className="location-line"><MapPin size={15}/>{venue.city}, {venue.state}</p>
        </div>
        <span className="detail-rating"><Star size={14} fill="currentColor"/>{venue.rating}<small>({venue.reviews})</small></span>
      </div>

      <p className="detail-description">{venue.description}</p>

      <div className="detail-stats">
        <Stat icon={Users} value={venue.capacity} label="Guests"/>
        <Stat icon={WalletCards} value={money(venue.price)} label="Starting from"/>
        <Stat icon={Clock3} value="Instant" label="Request options"/>
      </div>

      <div className="detail-section">
        <h2>Why couples choose it</h2>
        <div className="amenity-grid">
          {["Verified capacity","Transparent pricing","Real venue photos","Date availability","Wedding support","Secure hold"].map(x =>
            <div key={x}><Check size={15}/>{x}</div>
          )}
        </div>
      </div>

      <div className="detail-section">
        <h2>Good to know</h2>
        <p>
          Check availability first, then choose an instant booking request or instant holding request.
          A held date can still be booked by another customer, but it cannot be held again.
          Once booked, the date cannot be booked or held by anyone else.
        </p>
      </div>

      <div className="sticky-cta">
        <div className="sticky-price">
          <small>Venue starting from</small>
          <b>{money(venue.price)}</b>
          <span>Booking / holding: {money(holdFee(venue.price))}</span>
        </div>
        <div className="sticky-cta-actions">
          <button className="outline-button" onClick={() => openAction("availability")}>
            Check availability
          </button>
          <button className="outline-button" onClick={() => openAction("book")}>
            Instant booking request
          </button>
          <button className="primary-button" onClick={() => openAction("hold")}>
            Instant holding request
          </button>
        </div>
      </div>
    </div>

    {showBooking && (
      <BookingSheet
        venue={venue}
        action={bookingAction}
        date={date}
        setDate={setDate}
        event={event}
        setEvent={setEvent}
        availability={availability}
        checkingAvailability={checkingAvailability}
        availabilityEmail={availabilityEmail}
        setAvailabilityEmail={setAvailabilityEmail}
        availabilityPhone={availabilityPhone}
        setAvailabilityPhone={setAvailabilityPhone}
        availabilitySubmitted={availabilitySubmitted}
        setAvailabilitySubmitted={setAvailabilitySubmitted}
        checkAvailability={checkAvailability}
        submitSecureRequest={submitSecureRequest}
        message={message}
        close={closeAction}
      />
    )}
  </main>;
}

function Stat({icon:Icon,value,label}) {
  return <div><Icon size={18}/><b>{value}</b><span>{label}</span></div>;
}

function BookingSheet({
  venue,
  action,
  date,
  setDate,
  event,
  setEvent,
  availability,
  checkingAvailability,
  availabilityEmail,
  setAvailabilityEmail,
  availabilityPhone,
  setAvailabilityPhone,
  availabilitySubmitted,
  setAvailabilitySubmitted,
  checkAvailability,
  submitSecureRequest,
  message,
  close
}) {
  const available = availability?.status === "available";
  const held = availability?.status === "held";
  const booked = availability?.status === "booked";
  const requestAmount = holdFee(venue.price);

  return <div className="sheet-backdrop booking-backdrop" onClick={close}>
    <div className="booking-sheet" role="dialog" aria-modal="true" aria-label="Venue booking actions" onClick={e => e.stopPropagation()}>
      <div className="sheet-head">
        <div>
          <span className="eyebrow">VENUE ACTIONS</span>
          <h2>{venue.name}</h2>
          <p className="sheet-subtitle">Choose your date and the action you want to take.</p>
        </div>
        <button className="icon-button" onClick={close} aria-label="Close"><X/></button>
      </div>

      <label className="input-label date-field-label">
        Event date
        <div className="date-input-wrap">
          <CalendarDays size={18}/>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0,10)}
            onChange={e => {
              setDate(e.target.value);
              setAvailabilitySubmitted(false);
            }}
            aria-label="Event date"
          />
        </div>
      </label>

      <label className="input-label">
        Event
        <select value={event} onChange={e => setEvent(e.target.value)}>
          <option value="All Events">All wedding events</option>
          <option>Main Wedding</option>
          <option>Mehendi</option>
          <option>Sangeet</option>
          <option>Haldi</option>
          <option>Reception</option>
        </select>
      </label>

      {action === "availability" && !availabilitySubmitted && (
        <div className="availability-contact-fields">
          <label className="input-label">
            Email address
            <input
              type="email"
              value={availabilityEmail}
              onChange={e => setAvailabilityEmail(e.target.value)}
              onInput={e => setAvailabilityEmail(e.currentTarget.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
            />
          </label>
          <label className="input-label">
            Phone number
            <input
              type="tel"
              value={availabilityPhone}
              onChange={e => setAvailabilityPhone(e.target.value)}
              onInput={e => setAvailabilityPhone(e.currentTarget.value)}
              placeholder="10-digit mobile number"
              autoComplete="tel"
              inputMode="tel"
            />
          </label>
          <small className="availability-helper">We will share the availability details by email and WhatsApp.</small>
        </div>
      )}

      <div className="hold-selected-venue">
        <span>Selected venue</span>
        <b>{venue.name}</b>
        <small>{venue.city} · {money(venue.price)}</small>
      </div>

      {action !== "availability" && (
        <div className="hold-summary">
          <div>
            <span>{action === "book" ? "Booking amount" : "Refundable holding amount"}</span>
            <b>{money(requestAmount)}</b>
          </div>
          <small>
            {action === "book"
              ? "Booking amount is calculated at 10% of the venue price, with a ₹15,000 minimum and ₹75,000 maximum."
              : "Holding amount is refundable and calculated at 10% of the venue price, with a ₹15,000 minimum and ₹75,000 maximum."}
          </small>
        </div>
      )}

      {availability && !availabilitySubmitted && (
        <div className={`availability-status ${available ? "available" : held ? "held" : "booked"}`}>
          <span className="status-dot"/>
          <b>{available ? "Available" : held ? "On hold" : "Booked"}</b>
          <span>· {date}</span>
        </div>
      )}

      {message && !availabilitySubmitted && (
        <div className={`notice ${booked ? "error" : ""}`}>{message}</div>
      )}

      {action === "availability" && availabilitySubmitted ? (
        <div className="availability-confirmation">
          <div className="availability-confirmation-icon"><Check size={24}/></div>
          <h3>Request received</h3>
          <p>availability details will be share to mail and whatsapp shortly</p>
          <button
            className="primary-button wide"
            onClick={() => {
              setAvailabilitySubmitted(false);
              setAvailability(null);
              close();
            }}
          >
            Done
          </button>
        </div>
      ) : (
        <div className="booking-action-grid">
          <button
            className={`wide ${action === "availability" ? "primary-button" : "outline-button"}`}
            onClick={checkAvailability}
            disabled={checkingAvailability}
          >
            {checkingAvailability ? "Checking…" : "Check availability"}
          </button>

          <button
            className={`wide ${action === "book" ? "primary-button" : "outline-button"}`}
            onClick={() => submitSecureRequest("book")}
            disabled={!!availability && !availability.canBook}
          >
            Instant booking request
          </button>

          <button
            className={`wide ${action === "hold" ? "primary-button" : "outline-button"}`}
            onClick={() => submitSecureRequest("hold")}
            disabled={!!availability && !availability.canHold}
          >
            Instant holding request
          </button>
        </div>
      )}

      {!availabilitySubmitted && !availability && (
        <small className="booking-hint">Select an event date first. Availability is checked before booking or holding.</small>
      )}
      {!availabilitySubmitted && available && (
        <small className="booking-hint">Available: you can book this date or place a refundable hold.</small>
      )}
      {!availabilitySubmitted && held && (
        <small className="booking-hint">Held: another customer can still book this date, but nobody else can place another hold.</small>
      )}
      {!availabilitySubmitted && booked && (
        <small className="booking-hint">Booked: this date is unavailable for both booking and holding.</small>
      )}
    </div>
  </div>;
}

function DestinationsPage() {
  const googleEarthUrl = "https://earth.google.com/earth/d/1Od6DCW8A6N3FodXUR8CCERQIb5ghvRdp?usp=sharing";
  const osmUrl = "https://www.openstreetmap.org/export/embed.html?bbox=68%2C6%2C97%2C36&layer=mapnik";

  const pins = [
    { name: "Udaipur", left: "47%", top: "60%" },
    { name: "Jaipur", left: "43%", top: "43%" },
    { name: "Goa", left: "38%", top: "72%" },
    { name: "Kerala", left: "46%", top: "83%" },
    { name: "Hyderabad", left: "58%", top: "67%" }
  ];

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">DESTINATIONS</span>
          <h1>Go somewhere unforgettable.</h1>
          <p>Start with the place. We'll help you find the right venue.</p>
        </div>
      </div>

      <section className="earth-map-section">
        <div className="earth-map-card">
          <div className="earth-map-copy">
            <span className="eyebrow">EXPLORE INDIA</span>
            <h2>Find your wedding destination on the map.</h2>
            <p>Explore our curated wedding destinations directly on the map. Select a city or open the full Google Earth experience.</p>

            <div className="destination-pin-list">
              {pins.map(pin => (
                <Link key={pin.name} to={`/explore?city=${encodeURIComponent(pin.name)}`} className="map-destination-button">
                  <MapPin size={14}/>{pin.name}
                </Link>
              ))}
            </div>

            <a className="primary-button" href={googleEarthUrl} target="_blank" rel="noopener noreferrer">
              Open Google Earth <ArrowRight size={17}/>
            </a>
          </div>

          <div className="earth-map-frame visible-map">
            <iframe
              src={osmUrl}
              title="Venue Search India destination map"
              loading="lazy"
              allowFullScreen
            />
            <div className="map-pin-layer" aria-label="Venue Search destination markers">
              {pins.map(pin => (
                <Link
                  key={pin.name}
                  to={`/explore?city=${encodeURIComponent(pin.name)}`}
                  className="map-pin"
                  style={{left: pin.left, top: pin.top}}
                  title={`Explore ${pin.name}`}
                >
                  <span><MapPin size={17}/></span>
                </Link>
              ))}
            </div>
            <div className="map-status">
              <span><span className="live-dot"></span> VENUE SEARCH MAP</span>
              <a href={googleEarthUrl} target="_blank" rel="noopener noreferrer">Open Google Earth ↗</a>
            </div>
          </div>
        </div>
      </section>

      <div className="destination-large-grid">
        {destinations.map(d => (
          <Link key={d.name} to={`/explore?city=${encodeURIComponent(d.name)}`} className="destination-large">
            <img src={d.image} alt={d.name}/>
            <div><span>{d.label}</span><h2>{d.name}</h2><ArrowRight/></div>
          </Link>
        ))}
      </div>
    </main>
  );
}

function InspirationPage() { return <main className="page"><div className="page-head"><div><span className="eyebrow">INSPIRATION</span><h1>Plan the feeling.</h1><p>Guides, real weddings and ideas for your celebration.</p></div></div><div className="article-grid">{inspiration.concat(inspiration).map((x,i)=><article className="article-card" key={i}><img src={x.image}/><div><span>{x.category}</span><h2>{x.title}</h2><p>Thoughtful ideas for choosing a venue and creating a wedding that feels like yours.</p><button className="text-button">Read story <ArrowRight size={15}/></button></div></article>)}</div></main>; }

function ShortlistPage({saved,toggleSave}) { const list=fallbackVenues.filter(v=>saved.includes(v.id)); return <main className="page"><div className="page-head"><div><span className="eyebrow">YOUR SHORTLIST</span><h1>Beautiful possibilities.</h1><p>Keep the venues you love in one place.</p></div></div>{list.length?<div className="venue-grid">{list.map(v=><VenueCard key={v.id} venue={v} saved onSave={()=>toggleSave(v.id)}/>)}</div>:<EmptyState/>}</main>; }

function EmptyState(){return <div className="empty-state"><Heart size={28}/><h2>Your shortlist is waiting.</h2><p>Save a few venues while you explore. They'll appear here.</p><Link className="primary-button" to="/explore">Explore venues</Link></div>}

function WeddingPage({user,setUser}) {
  const eventNames=["Main Venue","Mehendi","Sangeet","Haldi","Reception"];
  const [events,setEvents]=useState(()=>{const v=safeStorage("vs_wedding_events",{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{}});
  const [destination,setDestination]=useState(()=>safeStorage("vs_wedding_destination","Udaipur"));
  const [guests,setGuests]=useState(()=>Number(safeStorage("vs_wedding_guests",250))||250);
  const [days,setDays]=useState(()=>Number(safeStorage("vs_wedding_days",3))||3);
  const [origin,setOrigin]=useState(()=>safeStorage("vs_wedding_origin","Hyderabad"));
  const [date,setDate]=useState(()=>safeStorage("vs_wedding_date",""));
  const [estimate,setEstimate]=useState(null);
  const [loadingEstimate,setLoadingEstimate]=useState(false);
  const [error,setError]=useState("");

  const available=fallbackVenues.filter(v=>v.city===destination);
  const venueById=Object.fromEntries(fallbackVenues.map(v=>[v.id,v]));
  const selectedCount=Object.keys(events).filter(k=>events[k]?.id).length;
  const venueTotal=Object.values(events).reduce((sum,v)=>sum+(Number(v?.price)||0),0);

  useEffect(()=>{localStorage.setItem("vs_wedding_events",JSON.stringify(events));},[events]);
  useEffect(()=>{localStorage.setItem("vs_wedding_destination",JSON.stringify(destination));localStorage.setItem("vs_wedding_guests",JSON.stringify(guests));localStorage.setItem("vs_wedding_days",JSON.stringify(days));localStorage.setItem("vs_wedding_origin",JSON.stringify(origin));localStorage.setItem("vs_wedding_date",JSON.stringify(date));},[destination,guests,days,origin,date]);

  const chooseVenue=(eventName,id)=>{
    const venue=venueById[id];
    if(!venue)return;
    setEvents(prev=>({...prev,[eventName]:venue}));
  };
  const removeEvent=(eventName)=>setEvents(prev=>{const next={...prev};delete next[eventName];return next;});

  const getEstimate=async()=>{
    setLoadingEstimate(true);setError("");
    try{
      const result=await api.budgetEstimate(localStorage.getItem("vs_token"), {destination,guests,origin,date,days,rooms:true,events:Math.max(1,selectedCount),travel:"Flights",comfort:"Premium",venueTotal});
      setEstimate(result);
    }catch(e){setError(e.message||"Unable to refresh market pricing.");}
    finally{setLoadingEstimate(false);}
  };

  const activeUser=user;
  return <main className="page">
    <div className="page-head"><div><span className="eyebrow">YOUR WEDDING</span><h1>Hi, {activeUser.name.split(" ")[0]}.</h1><p>Build every part of your celebration, choose venues for each event and keep one live budget.</p></div><Link className="text-button" to="/budget-calculator">Open full budget calculator <ArrowRight size={14}/></Link></div>

    <section className="wedding-planner-bar">
      <div><span>DESTINATION</span><select value={destination} onChange={e=>{setDestination(e.target.value);setEvents({})}}>{destinations.map(d=><option key={d.name}>{d.name}</option>)}</select></div>
      <div><span>GUESTS</span><input type="number" min="30" max="1000" value={guests} onChange={e=>setGuests(Math.max(30,Number(e.target.value)||30))}/></div>
      <div><span>DAYS</span><select value={days} onChange={e=>setDays(Number(e.target.value))}>{[1,2,3,4,5,6,7].map(x=><option key={x} value={x}>{x} {x===1?"day":"days"}</option>)}</select></div>
      <div><span>TRAVELLING FROM</span><select value={origin} onChange={e=>setOrigin(e.target.value)}>{["Hyderabad","Delhi","Mumbai","Bengaluru","Chennai","Kolkata"].map(x=><option key={x}>{x}</option>)}</select></div>
      <div><span>WEDDING DATE</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
    </section>

    <div className="wedding-summary"><div><span>SELECTED VENUE COST</span><b>{money(venueTotal)}</b></div><div><span>EVENTS ADDED</span><b>{selectedCount}/{eventNames.length}</b></div><button className="primary-button" onClick={getEstimate} disabled={loadingEstimate}>{loadingEstimate?"Updating market rates…":"Update live market estimate"}</button></div>

    <div className="wedding-dashboard">
      {eventNames.map(eventName=>{
        const v=events[eventName];
        return <div className={`event-card ${eventName==="Main Venue"?"featured":""}`} key={eventName}>
          <span>{eventName.toUpperCase()}</span>
          <h3>{v?.name||"Choose a venue"}</h3>
          {v?<><p>{v.city} · {money(v.price)} starting</p><button className="outline-button" onClick={()=>removeEvent(eventName)}>Remove</button></>:<small>Select a venue below to add this event to your wedding plan.</small>}
          <div className="event-venue-picker"><label>Venue in {destination}</label><select value={v?.id||""} onChange={e=>chooseVenue(eventName,e.target.value)}><option value="">Choose venue</option>{available.map(item=><option key={item.id} value={item.id}>{item.name} · {money(item.price)}</option>)}</select></div>
        </div>
      })}
    </div>

    {estimate&&<section className="ai-budget-card"><div><span className="eyebrow">PRICING INTELLIGENCE</span><h2>{money(estimate.total)} estimated total</h2><p>{estimate.sourceLabel||"Market benchmark"} · refreshed {new Date(estimate.updatedAt).toLocaleString()}</p></div><div className="ai-budget-grid">{Object.entries(estimate.breakdown||{}).map(([key,value])=><div key={key}><span>{key}</span><b>{money(value)}</b></div>)}</div></section>}
    {error&&<div className="notice error">{error}</div>}

    <div className="wedding-actions"><Link className="feature-link" to="/compare"><GitCompare/> Compare options <ArrowRight/></Link><Link className="feature-link" to="/guest-journey"><Navigation/> Guest journey <ArrowRight/></Link><Link className="feature-link" to="/budget-calculator"><WalletCards/> Budget planner <ArrowRight/></Link></div>
  </main>;
}
function AuthPage({setUser}) {
  const navigate=useNavigate();
  const [mode,setMode]=useState("login");
  const [step,setStep]=useState("email");
  const [form,setForm]=useState({name:"",email:"",phone:"",otp:""});
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [seconds,setSeconds]=useState(0);

  useEffect(()=>{
    if(!seconds) return;
    const timer=setInterval(()=>setSeconds(v=>v>0?v-1:0),1000);
    return()=>clearInterval(timer);
  },[seconds]);

  const switchMode=()=>{
    setMode(v=>v==="login"?"register":"login");
    setStep("email"); setError(""); setMessage(""); setForm({name:"",email:"",phone:"",otp:""}); setSeconds(0);
  };

  const sendOtp=async(e)=>{
    e.preventDefault(); setError(""); setMessage("");
    try{
      const data=await api.requestOtp({name:form.name,email:form.email,phone:form.phone,mode});
      setMessage(data.message||"OTP sent to your email.");
      setStep("otp"); setSeconds(60);
    }catch(err){setError(err.message)}
  };

  const verifyOtp=async(e)=>{
    e.preventDefault(); setError(""); setMessage("");
    try{
      const data=await api.verifyOtp({name:form.name,email:form.email,phone:form.phone,otp:form.otp,mode});
      localStorage.setItem("vs_token",data.token);
      localStorage.setItem("vs_user",JSON.stringify(data.user));
      setUser(data.user);
      navigate("/your-wedding",{replace:true});
    }catch(err){setError(err.message)}
  };

  const resend=async()=>{
    if(seconds) return;
    setError(""); setMessage("");
    try{
      const data=await api.requestOtp({name:form.name,email:form.email,phone:form.phone,mode});
      setMessage(data.message||"A new OTP has been sent."); setSeconds(60);
    }catch(err){setError(err.message)}
  };

  return <main className="auth-page">
    <div className="auth-image"></div>
    <div className="auth-card">
      <span className="eyebrow">VENUE SEARCH</span>
      <h1>{step==="otp"?"Check your email.":mode==="login"?"Welcome back.":"Start your wedding journey."}</h1>
      <p>{step==="otp"?`We sent a 6-digit verification code to ${form.email}. It expires in 10 minutes.`:"Sign in or create your account securely with an email OTP."}</p>
      {step==="email" ? <form onSubmit={sendOtp}>
        <input required placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <input required type="email" placeholder="Email address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
        <input required type="tel" inputMode="tel" autoComplete="tel" placeholder="Mobile number (e.g. +91 98765 43210)" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
        {error&&<div className="error">{error}</div>}
        {message&&<div className="notice">{message}</div>}
        <button className="primary-button wide">Send OTP</button>
      </form> : <form onSubmit={verifyOtp}>
        <input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Enter 6-digit OTP" value={form.otp} onChange={e=>setForm({...form,otp:e.target.value.replace(/\D/g,"").slice(0,6)})}/>
        {error&&<div className="error">{error}</div>}
        {message&&<div className="notice">{message}</div>}
        <button className="primary-button wide">Verify & Continue</button>
        <button type="button" className="text-button" onClick={resend} disabled={!!seconds}>{seconds?`Resend OTP in ${seconds}s`:"Resend OTP"}</button>
        <button type="button" className="text-button" onClick={()=>{setStep("email");setError("");setMessage("");}}>Change email</button>
      </form>}
      {step==="email"&&<button className="text-button" onClick={switchMode}>{mode==="login"?"New here? Create an account":"Already have an account? Sign in"}</button>}
    </div>
  </main>;
}

function SectionHeading({kicker,title,action,to}) { return <div className="section-heading"><div><span className="eyebrow">{kicker}</span><h2>{title}</h2></div>{action&&<Link className="text-button" to={to}>{action}<ArrowRight size={14}/></Link>}</div>; }

function ProfilePage({user}) {
  return <main className="page account-page"><div className="account-hero"><span className="eyebrow">PROFILE</span><div className="large-profile-avatar"><UserRound size={34}/></div><h1>{user.name}</h1><p>{user.email}{user.phone ? ` · ${user.phone}` : ""}</p><div className="account-actions"><Link className="primary-button" to="/your-wedding">Your Wedding <ArrowRight size={16}/></Link><Link className="outline-button" to="/my-estimations">My Estimations</Link></div></div></main>;
}

function EstimationsPage({user}) {
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{
    const token=localStorage.getItem("vs_token");
    api.estimates(token).then(d=>setItems(d.estimates||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  },[]);
  return <main className="page account-page"><div className="page-head"><div><span className="eyebrow">MY ESTIMATIONS</span><h1>Your wedding budgets.</h1><p>Every budget estimate you calculate is saved to your account.</p></div><Link className="primary-button" to="/budget-calculator">New estimation <Plus size={16}/></Link></div>{loading?<div className="empty-state"><p>Loading your estimations…</p></div>:error?<div className="notice error">{error}</div>:items.length?<div className="estimation-grid">{items.map(item=><article className="estimation-card" key={item.id}><span>{item.destination}</span><h2>{money(item.total)}</h2><p>{item.guests} guests · {item.days} days · {item.events} events</p><small>{item.date?`Wedding date: ${item.date}`:"Date not selected"}</small><Link className="text-button" to={`/explore?city=${encodeURIComponent(item.destination)}`}>Explore venues <ArrowRight size={14}/></Link></article>)}</div>:<div className="empty-state"><ClipboardList size={28}/><h2>No estimations yet.</h2><p>Create your first wedding budget and it will appear here.</p><Link className="primary-button" to="/budget-calculator">Create estimation</Link></div>}</main>;
}

function SettingsPage({user,setUser}) {
  const navigate=useNavigate();
  const logout=()=>{localStorage.removeItem("vs_token");localStorage.removeItem("vs_user");setUser(null);navigate("/login",{replace:true});};
  return <main className="page account-page"><div className="page-head"><div><span className="eyebrow">SETTINGS</span><h1>Account settings.</h1><p>Manage your Venue Search account and session.</p></div></div><section className="settings-card"><div><span>ACCOUNT</span><h2>{user.name}</h2><p>{user.email}</p></div><button className="logout-button" onClick={logout}><LogOut size={17}/> Logout</button></section></main>;
}

export default App;

function FeatureShell({kicker,title,text,children}){return <main className="feature-page"><div className="feature-page-head"><span className="eyebrow">{kicker}</span><h1>{title}</h1><p>{text}</p></div>{children}</main>}
function WeddingFitPage(){const[g,setG]=useState(250),[b,setB]=useState(1200000),[style,setStyle]=useState('Luxury');const list=[...fallbackVenues].map(v=>({...v,fit:Math.max(65,Math.min(99,Math.round(100-Math.abs(v.capacity-g)/8-(v.price>b?(v.price-b)/60000:0)+(style==='Luxury'&&['Palace','Heritage'].includes(v.type)?7:0))))})).sort((a,b)=>b.fit-a.fit);return <FeatureShell kicker="SMART DISCOVERY" title="Wedding Fit Score." text="Tell us what your wedding feels like. Venue Search ranks the spaces around your celebration, not just around filters."><div className="feature-layout"><div className="control-panel"><label>Guests <b>{g}</b><input type="range" min="50" max="700" step="10" value={g} onChange={e=>setG(+e.target.value)}/></label><label>Budget <b>{money(b)}</b><input type="range" min="300000" max="2500000" step="50000" value={b} onChange={e=>setB(+e.target.value)}/></label><label>Style<select value={style} onChange={e=>setStyle(e.target.value)}><option>Luxury</option><option>Royal</option><option>Intimate</option><option>Beach</option></select></label><div className="feature-note"><Sparkles/> Ranking updates instantly.</div></div><div className="rank-list">{list.slice(0,4).map(v=><Link to={'/venues/'+v.id} className="rank-card" key={v.id}><img src={v.image}/><div><span>{v.fit}% MATCH</span><h3>{v.name}</h3><p>{v.city} · {v.capacity} guests · {money(v.price)}</p></div><ArrowRight/></Link>)}</div></div></FeatureShell>}
function DatePulsePage(){return <FeatureShell kicker="DATE PULSE" title="Know your date before you chase the venue." text="A dedicated confidence screen intended to connect to live availability, holds and blackout dates."><div className="pulse-feature"><CalendarDays size={38}/><h2>14 February 2027</h2><div className="pulse-score"><b>HIGH</b><span>DATE CONFIDENCE</span></div><p>Demo signal across the curated venue set. Connect the production availability engine for real-time status.</p><Link className="primary-button" to="/explore">See matching venues <ArrowRight size={16}/></Link></div></FeatureShell>}
function GuestJourneyPage(){return <FeatureShell kicker="GUEST JOURNEY" title="Plan the wedding from your guest's point of view." text="A dedicated page for arrival, stay, celebration and movement — so venue choice considers the guest experience too."><div className="journey-feature">{[[MapPin,'Arrival','Airport / Rail'],[Home,'Stay','Hotel / Resort'],[Crown,'Celebration','Main venue'],[Sparkles,'After-party','Optional']].map(([I,a,b])=><React.Fragment key={a}><div className="journey-node"><I/><b>{a}</b><small>{b}</small></div>{a!=='After-party'&&<ArrowRight/>}</React.Fragment>)}</div><div className="feature-note wide-note"><Users/> Product differentiator: evaluate a venue as a complete guest journey, not only as a listing.</div></FeatureShell>}
function BudgetStudioPage(){return <BudgetCalculatorPage/>}
function Control({label, children}) {
  return <label className="calc-control">
    <span>{label}</span>
    {children}
  </label>;
}
function BudgetCalculatorPage({user}){
  const [destination,setDestination]=useState("Udaipur"),[guests,setGuests]=useState(250),[origin,setOrigin]=useState("Hyderabad"),[date,setDate]=useState(""),[days,setDays]=useState(3),[rooms,setRooms]=useState("Yes"),[events,setEvents]=useState(4),[travel,setTravel]=useState("Flights"),[comfort,setComfort]=useState("Premium");
  const [result,setResult]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState("");
  const calculate=async()=>{
    setLoading(true);setError("");
    const token=localStorage.getItem("vs_token");
    if(!token){setError("Please sign in to calculate and save your wedding budget.");setLoading(false);return;}
    const payload={
      destination:String(destination||""),
      guests:Number(guests),
      origin:String(origin||""),
      date:date||"",
      days:Number(days),
      rooms:rooms==="Yes",
      events:Number(events)||1,
      travel:String(travel||"Flights"),
      comfort:String(comfort||"Premium")
    };
    if(!payload.destination||!payload.origin||!Number.isFinite(payload.guests)||payload.guests<1||!Number.isFinite(payload.days)||payload.days<1){
      setError("Please select a destination, enter guests, choose travel origin and set wedding duration.");
      setLoading(false);
      return;
    }
    try{setResult(await api.budgetEstimate(token,payload));}
    catch(e){setError(e.message||"Unable to calculate the budget.");}
    finally{setLoading(false);}
  };
  useEffect(()=>{calculate();},[]);
  return <FeatureShell kicker="BUDGET CALCULATOR" title="A budget that changes with your wedding." text="We combine your inputs with destination-level 2026 market benchmarks. If live Google or AI pricing keys are configured on the server, the estimate can refresh from current web pricing; otherwise we use our researched benchmark ranges and clearly label them.">
    <div className="budget-calc-layout"><div className="control-panel">
      <Control label="Destination"><select value={destination} onChange={e=>setDestination(e.target.value)}>{destinations.map(d=><option key={d.name}>{d.name}</option>)}</select></Control>
      <Control label="Number of guests"><input type="number" min="30" max="1000" value={guests} onChange={e=>setGuests(Math.max(30,Number(e.target.value)||30))}/></Control>
      <Control label="Travelling from"><select value={origin} onChange={e=>setOrigin(e.target.value)}>{["Hyderabad","Delhi","Mumbai","Bengaluru","Chennai","Kolkata"].map(x=><option key={x}>{x}</option>)}</select></Control>
      <Control label="Wedding date"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Control>
      <Control label="Wedding duration"><select value={days} onChange={e=>setDays(Number(e.target.value))}>{[1,2,3,4,5,6,7].map(x=><option key={x} value={x}>{x} {x===1?"day":"days"}</option>)}</select></Control>
      <Control label="Accommodation for guests"><select value={rooms} onChange={e=>setRooms(e.target.value)}><option>Yes</option><option>No</option></select></Control>
      <Control label="Number of wedding events"><select value={events} onChange={e=>setEvents(Number(e.target.value))}>{[1,2,3,4,5].map(x=><option key={x} value={x}>{x}</option>)}</select></Control>
      <Control label="Travel mode"><select value={travel} onChange={e=>setTravel(e.target.value)}><option>Flights</option><option>Train</option><option>Road</option><option>Self-arranged</option></select></Control>
      <Control label="Comfort level"><select value={comfort} onChange={e=>setComfort(e.target.value)}><option>Premium</option><option>Luxury</option><option>Value</option></select></Control>
      <button className="primary-button wide" onClick={calculate} disabled={loading}>{loading?"Researching current pricing…":"Calculate with market pricing"}</button>
      <div className="feature-note"><Sparkles/> Pricing is an estimate, not a quote. Venue/date-specific quotes still need confirmation from the property.</div>
    </div><div className="budget-result">
      {result?<><span>ESTIMATED WEDDING BUDGET · INR</span><h2>{money(result.total)}</h2><p className="calc-date">{date?`For ${date}`:"Date not selected"} · {days} days · {guests} guests · {destination}</p>{Object.entries(result.breakdown||{}).map(([x,n])=><div key={x}><span>{x}</span><b>{money(n)}</b></div>)}<div className="budget-total"><span>Estimated total</span><b>{money(result.total)}</b></div><p className="pricing-source"><strong>{result.sourceLabel}</strong><br/>{result.notes}</p><Link className="primary-button" to={`/explore?city=${encodeURIComponent(destination)}`}>Find venues in this budget <ArrowRight size={16}/></Link></>:<div className="empty-state"><WalletCards size={28}/><h2>Build your estimate.</h2><p>Enter your wedding inputs and calculate an INR estimate.</p></div>}
      {error&&<div className="notice error">{error}</div>}
    </div></div>
  </FeatureShell>;
}
function ComparePage(){const list=fallbackVenues.slice(0,3);return <FeatureShell kicker="COMPARE ROOM" title="Decide without the spreadsheet." text="A dedicated decision room for venue finalists, with the numbers and fit signals side by side."><div className="compare-room">{list.map(v=><div className="compare-room-card" key={v.id}><img src={v.image}/><h2>{v.name}</h2><p>{v.city}</p>{[['Wedding Fit',v.score+'/100'],['Capacity',v.capacity],['Starting',money(v.price)],['Booking',v.mode]].map(([a,n])=><div className="metric" key={a}><span>{a}</span><b>{n}</b></div>)}</div>)}</div></FeatureShell>}
function VendorMarketplacePage(){return <FeatureShell kicker="VENUE ECOSYSTEM" title="Build the whole celebration around the venue." text="A dedicated vendor layer for the next stage of Venue Search — matched partners after the venue is shortlisted."><div className="vendor-grid">{['Decor & Styling','Catering','Photography','Guest Transport','Entertainment','Hospitality'].map((x,i)=><div className="vendor-card" key={x}><span>0{i+1}</span><h2>{x}</h2><p>Curated partners matched to your venue, guest count and celebration style.</p><ArrowRight/></div>)}</div></FeatureShell>}
