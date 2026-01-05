#!/bin/bash

# Database Backup Script for SQLite
# Usage: ./scripts/backup-db.sh [backup-dir]

set -e

# Configuration
DB_PATH="${DB_PATH:-./dev.db}"
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database file not found at $DB_PATH"
    exit 1
fi

# Create backup
echo "Creating backup..."
cp "$DB_PATH" "$BACKUP_FILE"

# Compress backup (optional)
if command -v gzip &> /dev/null; then
    echo "Compressing backup..."
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
fi

# Keep only last 30 backups
echo "Cleaning old backups (keeping last 30)..."
cd "$BACKUP_DIR"
ls -t backup_*.db* | tail -n +31 | xargs -r rm -f

echo "Backup completed: $BACKUP_FILE"
echo "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"

