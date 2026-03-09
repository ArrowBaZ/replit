#!/bin/bash

echo "Testing Docker setup..."
echo ""

# Test 1: Check docker-compose.yml exists
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml exists"
else
    echo "❌ docker-compose.yml missing"
    exit 1
fi

# Test 2: Check .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
else
    echo "❌ .env.local missing"
    exit 1
fi

# Test 3: Check setup script exists
if [ -f "script/setup-docker.sh" ]; then
    echo "✅ setup script exists"
else
    echo "❌ setup script missing"
    exit 1
fi

# Test 4: Check package.json has docker scripts
if grep -q "docker:up" package.json && grep -q "docker:down" package.json; then
    echo "✅ package.json has docker scripts"
else
    echo "❌ package.json missing docker scripts"
    exit 1
fi

# Test 5: Check drizzle config
if [ -f "drizzle.config.ts" ]; then
    echo "✅ drizzle.config.ts exists"
else
    echo "❌ drizzle.config.ts missing"
    exit 1
fi

echo ""
echo "✅ All setup files are in place!"
echo ""
echo "You can now run:"
echo "  ./script/setup-docker.sh"
echo ""
