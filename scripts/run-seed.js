/**
 * รัน seed โดยไม่ผ่าน prisma db seed (หลีกเลี่ยง schema-engine / network)
 * Usage: node scripts/run-seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
require('ts-node').register({ compilerOptions: { module: 'CommonJS' } })
require('../prisma/seed.ts')
