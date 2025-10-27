// audit.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logDir = path.resolve(__dirname, 'logs');
const logFile = path.join(logDir, 'audit.log');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Run ESLint and capture output
try {
  const eslintOutput = execSync('eslint . --format json', { encoding: 'utf8' });
  fs.writeFileSync(logFile, eslintOutput);
  console.log(`✅ ESLint audit written to ${logFile}`);
} catch (err) {
  fs.writeFileSync(logFile, err.stdout || err.message);
  console.error('❌ ESLint audit failed. Output written to audit.log');
}
