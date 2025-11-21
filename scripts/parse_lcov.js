const fs = require('fs');
const path = 'coverage/lcov.info';
if (!fs.existsSync(path)) {
  console.error('coverage/lcov.info not found');
  process.exit(1);
}
const s = fs.readFileSync(path, 'utf8');
const parts = s
  .split('end_of_record')
  .map((p) => p.trim())
  .filter(Boolean);
const files = [];
for (const p of parts) {
  const mSF = p.match(/SF:(.*)/);
  if (!mSF) continue;
  const file = mSF[1].trim();
  const mLF = p.match(/LF:(\d+)/);
  const mLH = p.match(/LH:(\d+)/);
  const LF = mLF ? parseInt(mLF[1], 10) : 0;
  const LH = mLH ? parseInt(mLH[1], 10) : 0;
  const pct = LF ? Math.round((LH / LF) * 10000) / 100 : 0;
  files.push({ file, LF, LH, pct });
}
files.sort((a, b) => b.pct - a.pct || b.file.localeCompare(a.file));
console.log(JSON.stringify(files, null, 2));
