const BENCHMARKS = {
  Udaipur: { baseGuests: 150, baseDays: 3, baseTotal: 4520000, venue: 1000000, foodPerPlate: 3500, roomPerNight: 10000, decor: 550000, photo: 350000, entertainment: 250000, logistics: 150000 },
  Jaipur: { baseGuests: 150, baseDays: 3, baseTotal: 4300000, venue: 1200000, foodPerPlate: 3200, roomPerNight: 8500, decor: 450000, photo: 300000, entertainment: 200000, logistics: 120000 },
  Goa: { baseGuests: 100, baseDays: 2, baseTotal: 5500000, venue: 1000000, foodPerPlate: 3200, roomPerNight: 12000, decor: 700000, photo: 300000, entertainment: 200000, logistics: 150000 },
  Kerala: { baseGuests: 100, baseDays: 3, baseTotal: 8000000, venue: 1200000, foodPerPlate: 3000, roomPerNight: 9500, decor: 650000, photo: 300000, entertainment: 180000, logistics: 150000 },
  Hyderabad: { baseGuests: 150, baseDays: 2, baseTotal: 3500000, venue: 700000, foodPerPlate: 2400, roomPerNight: 6500, decor: 400000, photo: 250000, entertainment: 150000, logistics: 100000 }
};

const ORIGIN_TRAVEL = { Hyderabad: 4500, Delhi: 5500, Mumbai: 5000, Bengaluru: 4800, Chennai: 5000, Kolkata: 6200 };
const DESTINATION_TRAVEL = { Udaipur: 1.0, Jaipur: 0.95, Goa: 1.1, Kerala: 1.15, Hyderabad: 0.75 };

function seasonFactor(date) {
  if (!date) return 1;
  const month = new Date(`${date}T12:00:00`).getMonth() + 1;
  if ([11,12,1,2].includes(month)) return 1.15;
  if ([3,4,10].includes(month)) return 1.0;
  return 0.82;
}

function tierFactor(comfort) {
  return comfort === 'Luxury' ? 1.32 : comfort === 'Value' ? 0.78 : 1;
}

function calculateBenchmark(input, overrideRates = null) {
  const destination = input.destination || 'Udaipur';
  const b = { ...(BENCHMARKS[destination] || BENCHMARKS.Udaipur), ...(overrideRates || {}) };
  const guests = Math.max(30, Number(input.guests) || 250);
  const days = Math.max(1, Number(input.days) || 3);
  const events = Math.max(1, Number(input.events) || 4);
  const comfort = input.comfort || 'Premium';
  const season = seasonFactor(input.date);
  const tier = tierFactor(comfort);
  const destinationFactor = DESTINATION_TRAVEL[destination] || 1;

  const venue = Number(input.venueTotal) > 0 ? Math.round(Number(input.venueTotal) * season * tier) : Math.round((b.venue * Math.pow(guests / b.baseGuests, 0.45) * Math.pow(days / b.baseDays, 0.25)) * season * tier);
  const foodPerPlate = Math.round((b.foodPerPlate || 3000) * tier * season);
  const food = Math.round(guests * events * foodPerPlate);
  const nights = Math.max(0, days - 1);
  const roomPerNight = Math.round((b.roomPerNight || 9000) * tier * season);
  const rooms = input.rooms === false ? 0 : Math.ceil(guests / 2) * nights * roomPerNight;
  const travelBase = ORIGIN_TRAVEL[input.origin] || 5000;
  const travelMode = input.travel || 'Flights';
  const travelMultiplier = travelMode === 'Train' ? 0.48 : travelMode === 'Road' ? 0.34 : travelMode === 'Self-arranged' ? 0.2 : 1;
  const travel = Math.round(guests * travelBase * destinationFactor * travelMultiplier);
  const decor = Math.round((b.decor || 500000) * Math.pow(guests / b.baseGuests, 0.5) * Math.max(0.85, events / 4) * season * tier);
  const photo = Math.round((b.photo || 300000) * (comfort === 'Luxury' ? 1.35 : comfort === 'Value' ? 0.8 : 1) * Math.pow(events / 4, 0.65));
  const entertainment = Math.round((b.entertainment || 200000) * Math.pow(events / 4, 0.8) * (comfort === 'Luxury' ? 1.35 : comfort === 'Value' ? 0.75 : 1));
  const logistics = Math.round((b.logistics || 150000) * Math.pow(guests / b.baseGuests, 0.65) * (days / b.baseDays));
  const subtotal = venue + food + rooms + travel + decor + photo + entertainment + logistics;
  const planning = Math.round(subtotal * (comfort === 'Luxury' ? 0.10 : 0.08));
  const contingency = Math.round((subtotal + planning) * 0.08);
  const total = subtotal + planning + contingency;

  return {
    total,
    breakdown: {
      'Venue & venue services': venue,
      'Food & beverages': food,
      'Guest accommodation': rooms,
      'Guest travel': travel,
      'Decor & production': decor,
      'Photography & film': photo,
      'Entertainment': entertainment,
      'Planning / coordination': planning,
      'Contingency': contingency
    }
  };
}

function parseJson(text) {
  try { return JSON.parse(text); } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

async function googleSearch(query) {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;
  if (!key || !cx) return null;
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google Search API returned ${response.status}`);
  const data = await response.json();
  return (data.items || []).slice(0, 5).map(x => ({ title: x.title, snippet: x.snippet, link: x.link }));
}

async function aiRates(input, googleResults) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const prompt = `You are a wedding pricing research assistant for an Indian destination wedding platform.\nInputs: ${JSON.stringify(input)}\nGoogle research snippets: ${JSON.stringify(googleResults || [])}\nReturn JSON only with these numeric fields in INR: venue, foodPerPlate, roomPerNight, decor, photo, entertainment, logistics. Use realistic 2026 market ranges, not a single luxury outlier. Do not invent exact venue quotes. Keep the values suitable for an estimate.`;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0.1, messages: [{ role: 'user', content: prompt }] })
  });
  if (!response.ok) throw new Error(`AI pricing service returned ${response.status}`);
  const data = await response.json();
  return parseJson(data.choices?.[0]?.message?.content || '');
}

async function getBudgetEstimate(input) {
  const normalized = { ...input, guests: Number(input.guests), days: Number(input.days), events: Number(input.events) };
  const query = `${normalized.destination} India destination wedding cost 2026 venue catering decor accommodation photography per plate`;
  let googleResults = null;
  let ai = null;
  let sourceLabel = '2026 researched market benchmark';
  let notes = 'Estimate based on destination-level wedding market benchmarks. Prices vary by venue, date, room block, taxes and final vendor quotes.';
  try { googleResults = await googleSearch(query); } catch {}
  try { ai = await aiRates(normalized, googleResults); } catch {}
  if (ai && typeof ai === 'object') {
    sourceLabel = 'AI pricing estimate using current Google research';
    notes = 'AI-assisted estimate generated from the current inputs and recent Google search results. Treat it as an estimate until venue/vendor quotes are confirmed.';
  } else if (googleResults?.length) {
    sourceLabel = 'Google research + 2026 benchmark';
    notes = 'Current Google search results were checked, then the estimate was calculated using Venue Search benchmark formulas. Search results are indicative, not venue quotes.';
  }
  const result = calculateBenchmark(normalized, ai);
  return { ...result, sourceLabel, notes, updatedAt: new Date().toISOString(), research: (googleResults || []).map(x => ({ title: x.title, link: x.link })).slice(0, 3) };
}

module.exports = { getBudgetEstimate, calculateBenchmark };
