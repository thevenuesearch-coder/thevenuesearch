const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src', 'styles.css');
let styles = fs.readFileSync(file, 'utf8');
const marker = '/* Availability request contact and confirmation styles */';

const css = `\n\n${marker}\n.availability-contact-fields{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin-top:10px!important}\n.availability-contact-fields .input-label input{width:100%!important;min-height:44px!important;padding:10px 12px!important;border:1px solid rgba(54,119,200,.42)!important;border-radius:10px!important;background:#07101a!important;color:#fff!important;outline:none!important}\n.availability-contact-fields .input-label input::placeholder{color:#71839a!important}\n.availability-confirmation{text-align:center!important;padding:24px 12px 8px!important}\n.availability-confirmation-icon{width:52px!important;height:52px!important;margin:0 auto 12px!important;display:grid!important;place-items:center!important;border-radius:50%!important;background:rgba(50,210,145,.14)!important;color:#5fe3a4!important;border:1px solid rgba(50,210,145,.35)!important}\n.availability-confirmation h3{margin:0 0 8px!important;color:#fff!important;font-size:20px!important}\n.availability-confirmation p{margin:0 auto 18px!important;max-width:420px!important;color:#a9b6c7!important;line-height:1.55!important;font-size:12px!important}\n@media(max-width:640px){.availability-contact-fields{grid-template-columns:1fr!important}}\n`;

const index = styles.indexOf(marker);
if (index >= 0) styles = styles.slice(0, index).trimEnd() + css;
else styles += css;

fs.writeFileSync(file, styles);
console.log('Availability request styles applied.');
