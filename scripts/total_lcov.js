const fs = require('fs');
const p = 'coverage/lcov.info';
if (!fs.existsSync(p)) {
  console.error('missing lcov');
  process.exit(2);
}
const lines = fs.readFileSync(p, 'utf8').split('\n');
let LF = 0,
  LH = 0;
for (const l of lines) {
  if (l.startsWith('LF:')) LF += Number(l.split(':')[1] || 0);
  if (l.startsWith('LH:')) LH += Number(l.split(':')[1] || 0);
}
const pct = LF ? Math.round((LH / LF) * 10000) / 100 : 0;
console.log(JSON.stringify({ LF, LH, pct }));
