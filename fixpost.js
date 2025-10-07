const fs = require('fs')
const path = require('path')

const postsPath = path.join(__dirname, 'WeatherLog.json')
const posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'))

const fixed = posts.map(post => ({
  ...post,
  createdAt: new Date(post.createdAt).toISOString(),
}))

fs.writeFileSync(postsPath, JSON.stringify(fixed, null, 2))
console.log('✅ WeatherLog.json timestamps fixed')
