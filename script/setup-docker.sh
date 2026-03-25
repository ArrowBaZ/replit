#!/bin/bash

# Sellzy Docker Setup Script
# This script helps set up the Docker-based PostgreSQL database

set -e

echo "🚀 Starting Sellzy Docker Setup"
echo "================================"

# Check if Docker is running
echo "🔍 Checking Docker..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker (Orbstack) first."
    exit 1
fi

echo "✅ Docker is running"

# Check if docker-compose exists
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install it first."
    exit 1
fi

echo "✅ docker-compose is available"

# Start PostgreSQL container
echo "🐳 Starting PostgreSQL container..."
docker-compose up -d

echo "✅ PostgreSQL container started"

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres -d sellzy >/dev/null 2>&1; then
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

# Set DATABASE_URL
echo "📝 Setting DATABASE_URL environment variable..."
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sellzy"
echo "   DATABASE_URL=$DATABASE_URL"

# Push Drizzle schema
echo "🗃️  Pushing Drizzle schema to create tables..."
npm run db:push

echo "✅ Database schema created!"

# Seed database with sample data
echo "🌱 Seeding database with sample data..."
./script/seed-database.sh

echo "✅ Database seeded!"

# Verify tables
echo "🔍 Verifying tables..."
TABLES=$(docker-compose exec -T postgres psql -U postgres -d sellzy -c "\dt" | grep -v "^(\|--" | grep -v "^$" | wc -l)
if [ "$TABLES" -gt 0 ]; then
    echo "✅ Tables created successfully!"
    echo ""
    echo "📊 Created tables:"
    docker-compose exec -T postgres psql -U postgres -d sellzy -c "\dt" | grep -v "^(\|--" | grep -v "^$"
else
    echo "⚠️  Warning: No tables found. Check the output above."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.local to .env and customize it"
echo "  2. Generate a SESSION_SECRET: openssl rand -hex 32"
echo "  3. Start the app: npm run dev"
echo ""
echo "To stop the database:"
echo "  npm run docker:down"
echo ""
echo "To reset the database (WARNING: deletes all data):"
echo "  npm run docker:reset"
