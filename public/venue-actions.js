(() => {
  const API = "https://thevenuesearch-backend.vercel.app/api";
  const fee = (price) => Math.min(75000, Math.max(15000, Math.round(Number(price || 0) * 0.10)));
  const venueId = () => location.pathname.match(/^\/venues\/([^/]+)/)?.[1] || null;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }

  async function getVenue() {
    const id = venueId();
    if (!id) return null;
    const res = await fetch(`${API}/venues/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error("Unable to load venue details.");
    return (await res.json()).venue;
  }

  function closeModal() {
    document.querySelector(".vs-action-modal")?.remove();
  }

  function showNotice(title, text) {
    closeModal();
    const el = document.createElement("div");
    el.className = "vs-action-modal";
    el.innerHTML = `<div class="vs-action-dialog vs-action-success"><button class="vs-action-close" aria-label="Close">×</button><div class="vs-action-success-icon">✓</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p><button class="vs-action-primary vs-action-close-btn">Done</button></div>`;
    document.body.appendChild(el);
    el.querySelectorAll(".vs-action-close,.vs-action-close-btn").forEach(b => b.addEventListener("click", closeModal));
  }

  function openForm(action, venue) {
    closeModal();
    const isAvailability = action === "availability";
    const isHold = action === "hold";
    const title = isAvailability ? "Check venue availability" : isHold ? "Instant holding request" : "Instant booking request";
    const feeText = isHold ? `<div class="vs-action-fee"><span>Refundable holding amount</span><b>₹${fee(venue.price).toLocaleString("en-IN")}</b><small>10% of venue price, minimum ₹15,000 and maximum ₹75,000.</small></div>` : "";
    const el = document.createElement("div");
    el.className = "vs-action-modal";
    el.innerHTML = `<div class="vs-action-dialog"><button class="vs-action-close" aria-label="Close">×</button><span class="vs-action-kicker">VENUE SEARCH</span><h3>${escapeHtml(title)}</h3><p class="vs-action-venue">${escapeHtml(venue.name)} · ${escapeHtml(venue.city)}</p><form><label>Event date<input name="date" type="date" min="${new Date().toISOString().slice(0,10)}" required></label><label>Email<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label><label>Phone number<input name="phone" type="tel" autocomplete="tel" placeholder="10-digit mobile number" required></label>${feeText}<div class="vs-action-error" role="alert"></div><button class="vs-action-primary" type="submit">${escapeHtml(isAvailability ? "Check availability" : isHold ? "Request holding" : "Request instant booking")}</button></form></div>`;
    document.body.appendChild(el);
    el.querySelectorAll(".vs-action-close").forEach(b => b.addEventListener("click", closeModal));
    el.addEventListener("click", e => { if (e.target === el) closeModal(); });
    el.querySelector("input[name=date]").focus();

    el.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = Object.fromEntries(new FormData(form).entries());
      const error = el.querySelector(".vs-action-error");
      const submit = form.querySelector("button[type=submit]");
      const phoneDigits = data.phone.replace(/\D/g, "");
      if (phoneDigits.length < 10 || phoneDigits.length > 15) { error.textContent = "Enter a valid phone number."; return; }
      submit.disabled = true; submit.textContent = "Processing…"; error.textContent = "";
      try {
        if (isAvailability) {
          const r = await fetch(`${API}/enquiries`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name:"Venue Search Customer",email:data.email,phone:data.phone,venueId:venue.id,date:data.date,message:"Availability request"})});
          const body = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(body.message || "Unable to submit the availability request.");
          showNotice("Request received", "availability details will be share to mail and whatsapp shortly");
          return;
        }

        const token = localStorage.getItem("vs_token");
        if (!token) {
          const r = await fetch(`${API}/enquiries`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name:"Venue Search Customer",email:data.email,phone:data.phone,venueId:venue.id,date:data.date,message:isHold?"Instant holding request":"Instant booking request"})});
          const body = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(body.message || "Unable to submit the request.");
          showNotice("Request received", isHold ? "Your holding request has been received. We will contact you shortly." : "Your booking request has been received. We will contact you shortly.");
          return;
        }

        const endpoint = isHold ? "/holds" : "/bookings";
        const r = await fetch(`${API}${endpoint}`, {method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}, body:JSON.stringify({venueId:venue.id,venueName:venue.name,date:data.date,eventType:"Main Wedding"})});
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.message || "Unable to complete the request.");
        showNotice(isHold ? "Date held successfully" : "Venue booked successfully", body.message || "Your request has been confirmed.");
      } catch (err) {
        error.textContent = err.message || "Something went wrong. Please try again.";
        submit.disabled = false;
        submit.textContent = isAvailability ? "Check availability" : isHold ? "Request holding" : "Request instant booking";
      }
    });
  }

  async function mountActions() {
    if (!venueId()) return;
    const cta = document.querySelector(".sticky-cta");
    if (!cta || cta.dataset.vsEnhanced === "1") return;
    cta.dataset.vsEnhanced = "1";
    try {
      const venue = await getVenue();
      if (!venue) return;
      const price = `₹${Number(venue.price || 0).toLocaleString("en-IN")}`;
      cta.innerHTML = `<div class="sticky-price"><small>Starting from</small><b>${price}</b><span>Venue action</span></div><div class="sticky-cta-actions"><button class="outline-button" data-vs-action="availability">Check availability</button><button class="outline-button" data-vs-action="booking">Instant booking request</button><button class="primary-button" data-vs-action="hold">Instant holding request</button></div>`;
      cta.querySelectorAll("[data-vs-action]").forEach(btn => btn.addEventListener("click", async () => {
        try { openForm(btn.dataset.vsAction, venue); } catch (e) { showNotice("Unable to continue", e.message); }
      }));
    } catch (e) {
      cta.dataset.vsEnhanced = "";
    }
  }

  const style = document.createElement("style");
  style.textContent = `.vs-action-modal{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:grid;place-items:center;padding:20px}.vs-action-dialog{position:relative;width:min(460px,100%);max-height:90vh;overflow:auto;background:#07101a;color:#f7faff;border:1px solid rgba(40,200,239,.28);border-radius:20px;padding:26px;box-shadow:0 25px 80px rgba(0,0,0,.5)}.vs-action-close{position:absolute;right:14px;top:12px;background:transparent;border:0;color:#b9c8d8;font-size:28px;cursor:pointer}.vs-action-kicker{font-size:10px;letter-spacing:.14em;color:#28c8ef}.vs-action-dialog h3{font:500 26px 'Playfair Display',serif;margin:8px 30px 4px 0}.vs-action-venue{color:#9fb0c5;font-size:12px;margin:0 0 20px}.vs-action-dialog label{display:block;font-size:11px;color:#9fb0c5;margin:12px 0}.vs-action-dialog input{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:12px;border-radius:10px;border:1px solid rgba(40,200,239,.25);background:#060d15;color:#fff;outline:none}.vs-action-dialog input:focus{border-color:#28c8ef}.vs-action-primary{width:100%;border:0;border-radius:11px;padding:13px 16px;background:linear-gradient(135deg,#2563eb,#22c7ed);color:#fff;font-weight:700;cursor:pointer}.vs-action-primary:disabled{opacity:.55;cursor:wait}.vs-action-error{min-height:18px;color:#ff8290;font-size:11px;margin:8px 0}.vs-action-fee{margin:14px 0;padding:12px;border:1px solid rgba(40,200,239,.2);border-radius:10px;background:#081521}.vs-action-fee span,.vs-action-fee small{display:block;color:#9fb0c5;font-size:10px}.vs-action-fee b{display:block;color:#fff;font-size:18px;margin:3px 0}.vs-action-success{text-align:center}.vs-action-success-icon{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;margin:4px auto 14px;background:linear-gradient(135deg,#2563eb,#22c7ed);font-size:26px}.vs-action-success h3{margin:0 0 10px}.vs-action-success p{color:#c4d2e2;line-height:1.65;font-size:12px;margin:0 auto 20px;max-width:360px}.vs-action-close-btn{width:auto;min-width:120px}.sticky-cta-actions>button{min-width:0}`;
  document.head.appendChild(style);

  const observer = new MutationObserver(() => mountActions());
  observer.observe(document.body, {subtree:true, childList:true});
  mountActions();
})();
