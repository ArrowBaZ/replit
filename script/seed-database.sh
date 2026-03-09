#!/bin/bash

# Database seeding script for Sellzy
# Uses the dump.sql file to populate the database

set -e

# Load environment variables from .env file
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "🌱 Starting database seeding..."
echo "================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    echo "Please set it in your .env file or export it"
    exit 1
fi

# Check if dump.sql exists
if [ ! -f "dump.sql" ]; then
    echo "❌ dump.sql file not found"
    echo "Please ensure the file exists in the project root"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

echo "✅ Database URL: $DATABASE_URL"
echo "✅ Seed file: dump.sql"

# Check if database is ready
for i in {1..30}; do
    if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Database did not become ready in time"
        exit 1
    fi
    sleep 1
    echo "  Waiting... ($i/30)"
done

echo "🗃️  Seeding database from dump.sql..."

# Import the SQL dump
psql "$DATABASE_URL" < dump.sql

echo "✅ Database seeded successfully!"

# Verify data was imported
echo "🔍 Verifying data..."

USERS=$(psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;" | grep -o '[0-9]*' | tail -1)
PROFILES=$(psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM profiles;" | grep -o '[0-9]*' | tail -1)
REQUESTS=$(psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM requests;" | grep -o '[0-9]*' | tail -1)

echo ""
echo "📊 Database statistics:"
echo "   Users: $USERS"
echo "   Profiles: $PROFILES"
echo "   Requests: $REQUESTS"

if [ "$USERS" -gt 0 ]; then
    echo ""
    echo "✅ Data imported successfully!"
    echo ""
    echo "Sample user:"
    psql "$DATABASE_URL" -c "SELECT id, email, first_name, last_name FROM users LIMIT 1;"
else
    echo "⚠️  Warning: No data imported. Check the dump.sql file."
fi

echo ""
echo "🎉 Seeding complete!"
