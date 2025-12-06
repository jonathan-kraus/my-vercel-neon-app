// scripts/write-marker.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const markerPath = path.join(__dirname, '..', 'prisma-marker.txt');

// Get current git commit hash
let commitHash = 'unknown';
try {
  commitHash = execSync('git rev-parse HEAD').toString().trim();
} catch (err) {
  console.warn('⚠️ Could not read git commit hash:', err.message);
}

// Get Prisma CLI version
let prismaVersion = 'unknown';
try {
  prismaVersion = execSync('pnpm prisma --version').toString().trim();
} catch (err) {
  console.warn('⚠️ Could not read Prisma version:', err.message);
}

// Build marker content
const content = [
  `Prisma client generated at: ${new Date().toISOString()}`,
  `Git commit: ${commitHash}`,
  `Prisma CLI version: ${prismaVersion}`,
  '',
].join('\n');

// Write marker file
fs.writeFileSync(markerPath, content, { flag: 'w' });

console.log(`✅ Marker file written to ${markerPath}`);
