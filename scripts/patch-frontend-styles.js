const fs = require('fs');
const path = require('path');
const stylesFile = path.join(process.cwd(), 'src', 'styles.css');
let styles = fs.readFileSync(stylesFile, 'utf8');
const marker = '/* Venue Search booking actions patch */';
if (!styles.includes(marker)) {
  styles += `\n\n${marker}\n.sticky-cta-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.sticky-cta-actions .outline-button,.sticky-cta-actions .primary-button{min-height:44px}.booking-action-grid{display:grid;grid-template-columns:1fr;gap:10px;margin-top:14px}.booking-hint{display:block;margin-top:10px;opacity:.75;line-height:1.5}@media(max-width:760px){.sticky-cta{gap:12px;align-items:flex-start!important;flex-direction:column}.sticky-cta-actions{width:100%;display:grid;grid-template-columns:1fr}.sticky-cta-actions button{width:100%}.booking-sheet{max-height:90vh;overflow:auto}}\n`;
  fs.writeFileSync(stylesFile, styles);
}
console.log('Venue Search booking styles applied.');
