const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src', 'App.js');
let source = fs.readFileSync(file, 'utf8');
source = source.replace("setDate(e.target.value); setAvailability(null); setMessage('');", "setDate(e.target.value); setMessage('');");
fs.writeFileSync(file, source);
console.log('Venue Search frontend compatibility fix applied.');
