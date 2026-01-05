/**
 * Database Backup Script
 * 
 * This script creates a backup of the SQLite database
 * Usage: node scripts/backup-db.js [output-path]
 */

const fs = require('fs')
const path = require('path')

const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'dev.db')
const BACKUP_DIR = path.join(process.cwd(), 'backups')

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
const backupFilename = `backup-${timestamp}.db`
const backupPath = process.argv[2] || path.join(BACKUP_DIR, backupFilename)

// Check if database file exists
if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ Database file not found: ${DB_PATH}`)
  process.exit(1)
}

try {
  // Copy database file
  fs.copyFileSync(DB_PATH, backupPath)
  
  const stats = fs.statSync(backupPath)
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
  
  console.log(`✅ Backup created successfully!`)
  console.log(`   Source: ${DB_PATH}`)
  console.log(`   Destination: ${backupPath}`)
  console.log(`   Size: ${fileSizeInMB} MB`)
  console.log(`   Timestamp: ${new Date().toISOString()}`)
} catch (error) {
  console.error(`❌ Backup failed:`, error.message)
  process.exit(1)
}

