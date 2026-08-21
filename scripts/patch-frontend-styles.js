const fs = require('fs');
const path = require('path');
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
console.log('Venue Search booking/calendar styles applied.');
