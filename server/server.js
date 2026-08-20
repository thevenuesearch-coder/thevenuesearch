require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { getBudgetEstimate } = require("./pricingEngine");

const app = express();
const PORT = process.env.API_PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "venue-search-local-secret-change-me";
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const files = {
  venues: path.join(DATA_DIR, "venues.json"),
  users: path.join(DATA_DIR, "users.json"),
  bookings: path.join(DATA_DIR, "bookings.json"),
  enquiries: path.join(DATA_DIR, "enquiries.json"),
  estimates: path.join(DATA_DIR, "estimates.json"),
  otps: path.join(DATA_DIR, "otps.json")
};

function read(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) { write(file, fallback); return fallback; }
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch { return fallback; }
}
function write(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

const seedVenues = [
  {id:"udaipur-palace",name:"The Lake Palace Estate",city:"Udaipur",state:"Rajasthan",price:1800000,capacity:450,rating:4.9,reviews:86,type:"Palace",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=88",tags:["Lake View","Luxury","Rooms"],description:"A grand lakeside setting designed for multi-day destination celebrations, with palace architecture, intimate courtyards and panoramic water views."},
  {id:"udaipur-garden",name:"Aravalli Garden Retreat",city:"Udaipur",state:"Rajasthan",price:950000,capacity:250,rating:4.8,reviews:54,type:"Resort",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1400&q=88",tags:["Garden","Mountain View","Pool"],description:"A relaxed luxury resort surrounded by the Aravallis, ideal for intimate ceremonies, cocktail evenings and vibrant mehendi celebrations."},
  {id:"udaipur-lake-house",name:"The Lakeview Courtyard",city:"Udaipur",state:"Rajasthan",price:650000,capacity:180,rating:4.7,reviews:39,type:"Boutique",mode:"Instant Book",verified:true,image:"https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=88",tags:["Intimate","Lake View","Boutique"],description:"A private-feeling boutique venue for couples who want an elegant celebration without the scale of a large palace wedding."},
  {id:"jaipur-heritage",name:"Pink City Heritage Haveli",city:"Jaipur",state:"Rajasthan",price:1100000,capacity:300,rating:4.8,reviews:61,type:"Heritage",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1400&q=88",tags:["Heritage","Courtyard","Luxury"],description:"A character-rich Jaipur haveli with courtyards, terraces and heritage details for traditional Indian celebrations."},
  {id:"goa-coast",name:"Coco Palm Beach Resort",city:"Goa",state:"Goa",price:1250000,capacity:350,rating:4.9,reviews:72,type:"Beach Resort",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=88",tags:["Beach","Rooms","Pool"],description:"A tropical celebration venue with beachfront ceremony spaces, open-air dining and a relaxed destination wedding atmosphere."},
  {id:"kerala-backwater",name:"Backwater Banyan Retreat",city:"Alleppey",state:"Kerala",price:780000,capacity:220,rating:4.8,reviews:44,type:"Resort",mode:"Instant Book",verified:true,image:"https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1400&q=88",tags:["Backwaters","Garden","Intimate"],description:"A lush backwater retreat for couples looking for a slower, deeply scenic celebration with Kerala-inspired hospitality."},
  {id:"jaipur-royal-garden",name:"Amber Garden Palace",city:"Jaipur",state:"Rajasthan",price:1450000,capacity:380,rating:4.8,reviews:48,type:"Palace",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&q=88",tags:["Courtyard","Royal","Garden"],description:"A royal Jaipur setting with open courtyards and elegant gardens for multi-day celebrations."},
  {id:"goa-lagoon",name:"Azure Lagoon Resort",city:"Goa",state:"Goa",price:980000,capacity:280,rating:4.8,reviews:51,type:"Beach Resort",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=88",tags:["Beach","Pool","Sunset"],description:"A coastal venue with sunset lawns and private event spaces."},
  {id:"goa-cliff",name:"Cabo Sunset Estate",city:"Goa",state:"Goa",price:1550000,capacity:420,rating:4.9,reviews:67,type:"Luxury Resort",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=88",tags:["Cliffside","Sunset","Luxury"],description:"A dramatic coastal estate for large luxury celebrations."},
  {id:"kerala-heritage",name:"Heritage Backwater Palace",city:"Kerala",state:"Kerala",price:1320000,capacity:360,rating:4.9,reviews:55,type:"Heritage",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=88",tags:["Heritage","Backwater","Luxury"],description:"A heritage-inspired property with elegant waterfront spaces."},
  {id:"hyderabad-palace",name:"Falaknuma Inspired Estate",city:"Hyderabad",state:"Telangana",price:1600000,capacity:400,rating:4.8,reviews:44,type:"Palace",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1400&q=88",tags:["Palace","Royal","Grand"],description:"A grand Hyderabad celebration setting inspired by the city's royal architecture."},
  {id:"hyderabad-lake",name:"Deccan Lake Resort",city:"Hyderabad",state:"Telangana",price:890000,capacity:260,rating:4.7,reviews:33,type:"Resort",mode:"Instant Book",verified:true,image:"https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1400&q=88",tags:["Lake","Garden","Rooms"],description:"A modern resort with flexible spaces for destination-style celebrations."},
  {id:"hyderabad-courtyard",name:"Deccan Courtyard House",city:"Hyderabad",state:"Telangana",price:580000,capacity:140,rating:4.6,reviews:21,type:"Boutique",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=88",tags:["Courtyard","Intimate","Modern"],description:"A stylish intimate venue for smaller celebrations."},
  {id:"udaipur-aravalli",name:"Aravalli Sunset Palace",city:"Udaipur",state:"Rajasthan",price:1380000,capacity:330,rating:4.9,reviews:63,type:"Heritage",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1606298855672-3efb63017be8?auto=format&fit=crop&w=1400&q=88",tags:["Aravalli","Sunset","Heritage"],description:"A panoramic Aravalli venue with sunset terraces and heritage architecture."},
  {id:"udaipur-garden-estate",name:"Mewar Garden Estate",city:"Udaipur",state:"Rajasthan",price:760000,capacity:210,rating:4.7,reviews:29,type:"Garden",mode:"Instant Book",verified:true,image:"https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1400&q=88",tags:["Garden","Intimate","Open Air"],description:"A garden estate for colourful ceremonies and outdoor dinners."},
  {id:"udaipur-heritage",name:"Mewar Heritage Courtyard",city:"Udaipur",state:"Rajasthan",price:1080000,capacity:280,rating:4.8,reviews:42,type:"Heritage",mode:"Instant Hold",verified:true,image:"https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=88",tags:["Heritage","Courtyard","Luxury"],description:"A heritage courtyard combining traditional details with modern guest comfort."}
];

if (!fs.existsSync(files.venues)) write(files.venues, seedVenues);
for (const f of [files.users, files.bookings, files.enquiries, files.estimates, files.otps]) if (!fs.existsSync(f)) write(f, []);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

function publicUser(user) { return { id: user.id, name: user.name, email: user.email, phone: user.phone || "", role: user.role }; }
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Sign in required" });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: "Your session has expired. Please sign in again." }); }
}
function calculateHoldFee(price) { return Math.min(75000, Math.max(15000, Math.round(price * 0.10))); }

app.get("/api/health", (_, res) => res.json({ ok: true, service: "Venue Search API" }));

app.get("/api/venues", (req, res) => {
  const { city, type, minGuests, maxPrice, q } = req.query;
  let venues = read(files.venues, seedVenues);
  venues = venues.filter(v =>
    (!city || v.city.toLowerCase() === city.toLowerCase()) &&
    (!type || v.type === type) &&
    (!minGuests || v.capacity >= Number(minGuests)) &&
    (!maxPrice || v.price <= Number(maxPrice)) &&
    (!q || `${v.name} ${v.city} ${v.type}`.toLowerCase().includes(q.toLowerCase()))
  );
  res.json({ venues });
});

app.get("/api/venues/:id", (req, res) => {
  const venue = read(files.venues, seedVenues).find(v => v.id === req.params.id);
  if (!venue) return res.status(404).json({ message: "Venue not found" });
  res.json({ venue });
});

function otpHash(otp) {
  return crypto.createHash("sha256").update(`${otp}:${JWT_SECRET}`).digest("hex");
}
function createMailer() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: { user, pass }
  });
}

function normalizePhone(value) {
  const phone = String(value || "").trim();
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return phone;
}

async function sendAdminLoginNotification(mailer, user, mode) {
  const adminEmail = process.env.ADMIN_EMAIL || "thevenuesearch@gmail.com";
  if (!mailer || !adminEmail) return;
  const eventLabel = mode === "register" ? "New account created" : "User logged in";
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  await mailer.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: adminEmail,
    subject: `Venue Search - ${eventLabel}: ${user.name || user.email}`,
    text: `${eventLabel}\n\nName: ${user.name || "Not provided"}\nEmail: ${user.email}\nPhone: ${user.phone || "Not provided"}\nTime: ${timestamp}\n`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px;border:1px solid #e5e7eb;border-radius:16px"><h2>Venue Search</h2><h3>${eventLabel}</h3><p><b>Name:</b> ${user.name || "Not provided"}</p><p><b>Email:</b> ${user.email}</p><p><b>Phone:</b> ${user.phone || "Not provided"}</p><p><b>Time:</b> ${timestamp} IST</p></div>`
  });
}

app.post("/api/auth/request-otp", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const name = String(req.body?.name || "").trim();
    const phone = normalizePhone(req.body?.phone);
    const mode = req.body?.mode === "register" ? "register" : "login";
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });

    const users = read(files.users, []);
    const existing = users.find(u => u.email.toLowerCase() === email);
    if (mode === "register" && existing) return res.status(409).json({ message: "An account already exists with this email. Please use Sign in." });
    if (mode === "login" && !existing) return res.status(404).json({ message: "No account found with this email. Please create an account first." });
    if (!name) return res.status(400).json({ message: "Enter your full name." });
    if (!phone) return res.status(400).json({ message: "Enter a valid mobile number (10 to 15 digits)." });

    const otps = read(files.otps, []);
    const recent = otps.find(x => x.email === email && Date.now() - new Date(x.createdAt).getTime() < 60 * 1000);
    if (recent) return res.status(429).json({ message: "Please wait a minute before requesting another OTP." });

    const otp = String(crypto.randomInt(100000, 1000000));
    const record = {
      id: crypto.randomUUID(), email, name, phone, mode,
      otpHash: otpHash(otp), attempts: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    };
    const filtered = otps.filter(x => x.email !== email || new Date(x.expiresAt).getTime() > Date.now());
    filtered.push(record); write(files.otps, filtered);

    const mailer = createMailer();
    if (!mailer) {
      console.error(`[Venue Search] SMTP is not configured. OTP for ${email}: ${otp}`);
      return res.status(503).json({ message: "Email service is not configured. Add SMTP settings to .env and restart the server." });
    }
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    await mailer.sendMail({
      from,
      to: email,
      subject: "Your Venue Search verification code",
      text: `Your Venue Search OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:16px"><h2>Venue Search</h2><p>Your verification code is:</p><div style="font-size:36px;letter-spacing:8px;font-weight:700;padding:18px 0">${otp}</div><p>This code expires in <b>10 minutes</b>.</p><p style="color:#6b7280">If you did not request this code, you can safely ignore this email.</p></div>`
    });
    res.json({ message: `OTP sent to ${email}` });
  } catch (e) {
    console.error("OTP request error:", e);
    res.status(500).json({ message: "Unable to send OTP. Please try again." });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();
    const name = String(req.body?.name || "").trim();
    const phone = normalizePhone(req.body?.phone);
    const mode = req.body?.mode === "register" ? "register" : "login";
    if (!email || !/^\d{6}$/.test(otp)) return res.status(400).json({ message: "Enter the 6-digit OTP sent to your email." });
    if (!name) return res.status(400).json({ message: "Enter your full name." });
    if (!phone) return res.status(400).json({ message: "Enter a valid mobile number (10 to 15 digits)." });

    const otps = read(files.otps, []);
    const record = otps.find(x => x.email === email);
    if (!record) return res.status(400).json({ message: "This OTP is invalid or has expired. Request a new one." });
    if (new Date(record.expiresAt).getTime() < Date.now()) {
      write(files.otps, otps.filter(x => x.id !== record.id));
      return res.status(400).json({ message: "This OTP has expired. Request a new one." });
    }
    if (record.attempts >= 5) return res.status(429).json({ message: "Too many incorrect attempts. Request a new OTP." });
    if (otpHash(otp) !== record.otpHash) {
      record.attempts += 1; write(files.otps, otps);
      return res.status(401).json({ message: "Incorrect OTP. Please check your email and try again." });
    }

    const users = read(files.users, []);
    let user = users.find(u => u.email.toLowerCase() === email);
    if (mode === "register") {
      if (user) return res.status(409).json({ message: "An account already exists with this email. Please sign in." });
      user = { id: crypto.randomUUID(), name: name || record.name || email.split("@")[0], email, phone: phone || record.phone || "", role: "couple", createdAt: new Date().toISOString(), emailVerified: true, authMethod: "email_otp" };
      users.push(user);
    } else {
      if (!user) return res.status(404).json({ message: "No account found with this email. Please create an account first." });
      user.emailVerified = true;
      user.authMethod = user.authMethod || "email_otp";
      user.name = name || user.name || record.name || email.split("@")[0];
      user.phone = phone || user.phone || record.phone || "";
    }
    write(files.users, users);
    write(files.otps, otps.filter(x => x.id !== record.id));
    const mailer = createMailer();
    if (mailer) {
      try {
        await sendAdminLoginNotification(mailer, user, mode);
      } catch (notificationError) {
        console.error("Admin login notification error:", notificationError);
      }
    }
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: publicUser(user) });
  } catch (e) {
    console.error("OTP verification error:", e);
    res.status(500).json({ message: "Unable to verify OTP. Please try again." });
  }
});

app.get("/api/auth/me", auth, (req, res) => {
  const user = read(files.users, []).find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: publicUser(user) });
});

app.get("/api/profile", auth, (req, res) => {
  const user = read(files.users, []).find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: publicUser(user) });
});

app.get("/api/estimates", auth, (req, res) => {
  const estimates = read(files.estimates, []).filter(x => x.userId === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ estimates });
});

app.post("/api/budget-estimate", auth, async (req, res) => {
  try {
    const body = req.body || {};
    const destination = String(body.destination || "").trim();
    const origin = String(body.origin || "").trim();
    const guests = Number(body.guests);
    const days = Number(body.days);
    const requestedEvents = Number(body.events);
    const events = Number.isFinite(requestedEvents) && requestedEvents > 0 ? Math.min(10, Math.floor(requestedEvents)) : 1;
    const date = body.date ? String(body.date) : "";
    const rooms = body.rooms === true || body.rooms === "true" || body.rooms === "Yes";
    const travel = String(body.travel || "Flights");
    const comfort = String(body.comfort || "Premium");

    // The calculator should accept valid selections regardless of whether a
    // browser sends numeric fields as strings or numbers. Only genuinely
    // missing/invalid core inputs should be rejected.
    if (!destination || !origin || !Number.isFinite(guests) || guests < 1 ||
        !Number.isFinite(days) || days < 1) {
      return res.status(400).json({ message: "Please select a destination, enter guests, choose travel origin and set wedding duration." });
    }

    const estimate = await getBudgetEstimate({ destination, guests, origin, date, days, rooms, events, travel, comfort });
    const estimates = read(files.estimates, []);
    estimates.push({
      id: crypto.randomUUID(), userId: req.user.id, destination, guests, origin,
      date, days, rooms, events, travel, comfort, ...estimate,
      createdAt: new Date().toISOString()
    });
    write(files.estimates, estimates);
    res.json(estimate);
  } catch (e) {
    console.error("Budget estimate error:", e);
    res.status(500).json({ message: e.message || "Unable to calculate budget" });
  }
});

app.post("/api/enquiries", (req, res) => {
  const { name, email, phone, venueId, date, guestCount, message } = req.body || {};
  if (!name || !email || !venueId) return res.status(400).json({ message: "Name, email and venue are required" });
  const enquiries = read(files.enquiries, []);
  const enquiry = { id: crypto.randomUUID(), name, email, phone, venueId, date, guestCount, message, status: "new", createdAt: new Date().toISOString() };
  enquiries.push(enquiry); write(files.enquiries, enquiries);
  res.status(201).json({ message: "Enquiry received. The venue team can now respond.", enquiry });
});

app.post("/api/holds", auth, (req, res) => {
  const { venueId, venueName, date, eventType = "Main Wedding" } = req.body || {};
  if (!venueId || !venueName || !date) return res.status(400).json({ message: "Venue and date are required" });
  const venues = read(files.venues, seedVenues);
  const venue = venues.find(v => v.id === venueId);
  if (!venue) return res.status(404).json({ message: "Venue not found" });
  const bookings = read(files.bookings, []);
  const active = bookings.filter(b => new Date(b.expiresAt || "9999-12-31").getTime() > Date.now() && ["held", "confirmed"].includes(b.status));
  if (active.some(b => b.venueId === venueId && b.date === date)) return res.status(409).json({ message: "This date is no longer available for this venue." });
  const hold = { id: crypto.randomUUID(), userId: req.user.id, venueId, venueName, date, eventType, status: "held", holdFee: calculateHoldFee(venue.price), createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() };
  bookings.push(hold); write(files.bookings, bookings);
  res.status(201).json({ message: "Date held successfully for 72 hours.", hold });
});

app.get("/api/weddings", auth, (req, res) => {
  const bookings = read(files.bookings, []).filter(b => b.userId === req.user.id);
  const venues = read(files.venues, seedVenues);
  const events = bookings.map(b => ({ eventType: b.eventType, venueId: b.venueId, venueName: b.venueName || venues.find(v => v.id === b.venueId)?.name || "Venue", city: venues.find(v => v.id === b.venueId)?.city, date: b.date, status: b.status }));
  const main = events.find(e => e.eventType === "Main Wedding");
  res.json({ wedding: { mainVenue: main || null, events } });
});

app.listen(PORT, () => console.log(`Venue Search API running on http://localhost:${PORT}`));
