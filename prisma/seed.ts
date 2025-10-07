import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const post = JSON.parse(fs.readFileSync(path.join(__dirname, '../post.json'), 'utf-8'))
const user = JSON.parse(fs.readFileSync(path.join(__dirname, '../user.json'), 'utf-8'))
const weatherlog = JSON.parse(fs.readFileSync(path.join(__dirname, '../weatherlog.json'), 'utf-8'))

async function main() {
  await prisma.user.createMany({ data: user })
  await prisma.post.createMany({ data: post })
  await prisma.weatherLog.createMany({ data: weatherlog })
}

main()
  .catch(e => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
