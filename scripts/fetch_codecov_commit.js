const https = require('https');
const fs = require('fs');
const token = process.env.CODECOV_TOKEN;
if (!token) {
  console.error('CODECOV_TOKEN missing');
  process.exit(2);
}
const url =
  'https://app.codecov.io/api/gh/jonathan-kraus/my-vercel-neon-app/commit/b80f00fe243707d9dd32247c6ab7462b2b56e712';
const options = {
  headers: {
    Authorization: `token ${token}`,
    Accept: 'application/json',
  },
};
https
  .get(url, options, (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      try {
        fs.writeFileSync('codecov_commit.json', data, 'utf8');
        console.log('status', res.statusCode);
        console.log(data.substring(0, 1000));
      } catch (e) {
        console.error('write failed', e);
        process.exit(3);
      }
    });
  })
  .on('error', (e) => {
    console.error('request failed', e);
    process.exit(4);
  });
