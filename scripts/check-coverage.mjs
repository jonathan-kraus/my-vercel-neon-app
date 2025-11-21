#!/usr/bin/env node
import fs from 'fs';

const usage = () => {
  console.log('Usage: node scripts/check-coverage.mjs <threshold-percent>');
  process.exit(1);
};

const threshold = Number(process.argv[2]);
if (Number.isNaN(threshold)) usage();

const lcovPath = './coverage/lcov.info';
if (!fs.existsSync(lcovPath)) {
  console.error('Coverage file not found:', lcovPath);
  process.exit(2);
}

const content = fs.readFileSync(lcovPath, 'utf8');
const lines = content.split('\n');

let totalLF = 0;
let totalLH = 0;

for (const line of lines) {
  if (line.startsWith('LF:')) {
    totalLF += parseInt(line.slice(3), 10) || 0;
  } else if (line.startsWith('LH:')) {
    totalLH += parseInt(line.slice(3), 10) || 0;
  }
}

if (totalLF === 0) {
  console.error('No lines found in lcov report');
  process.exit(2);
}

const pct = (totalLH / totalLF) * 100;
const rounded = Math.round(pct * 100) / 100;

console.log(`Total lines: ${totalLH}/${totalLF} (${rounded}%)`);

if (pct < threshold) {
  console.error(`Coverage ${rounded}% is below threshold ${threshold}%`);
  process.exit(3);
}

console.log(`Coverage threshold ${threshold}% met (${rounded}%)`);
process.exit(0);
