#!/bin/bash

echo "🔍 Verifying Docker setup..."
echo ""

# Check all required files exist
REQUIRED_FILES=(
    "docker-compose.yml"
    ".env.local"
    ".env"
    "script/setup-docker.sh"
    "script/seed-database.sh"
    "dump.sql"
    "README.md"
    "README-docker.md"
    "DOCKER-SETUP-SUMMARY.md"
)

ALL_OK=true

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        ALL_OK=false
    fi
done

echo ""

# Check package.json scripts
if grep -q "db:seed-sql" package.json && grep -q "docker:reset" package.json; then
    echo "✅ package.json has required scripts"
else
    echo "❌ package.json missing required scripts"
    ALL_OK=false
fi

echo ""

# Check environment variables
if grep -q "DB_SEED_FILE" .env.local; then
    echo "✅ .env.local has DB_SEED_FILE"
else
    echo "❌ .env.local missing DB_SEED_FILE"
    ALL_OK=false
fi

if grep -q "DB_SEED_FILE" .env; then
    echo "✅ .env has DB_SEED_FILE"
else
    echo "❌ .env missing DB_SEED_FILE"
    ALL_OK=false
fi

echo ""

# Check dump.sql exists and has content
if [ -f "dump.sql" ]; then
    SIZE=$(wc -c < dump.sql)
    if [ "$SIZE" -gt 1000 ]; then
        echo "✅ dump.sql exists and has content ($SIZE bytes)"
    else
        echo "⚠️  dump.sql exists but seems empty or very small ($SIZE bytes)"
    fi
else
    echo "❌ dump.sql missing"
    ALL_OK=false
fi

echo ""

if [ "$ALL_OK" = true ]; then
    echo "✅ All setup files are in place!"
    echo ""
    echo "You can now run:"
    echo "  ./script/setup-docker.sh"
    echo ""
    echo "Or manually:"
    echo "  npm run docker:up"
    echo "  npm run db:push"
    echo "  npm run db:seed-sql"
    exit 0
else
    echo "❌ Some files are missing. Please check the setup."
    exit 1
fi
