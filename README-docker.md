# Docker Setup for Sellzy

## Quick Start with Docker

### 1. Start PostgreSQL

```bash
# Start the database container
docker-compose up -d

# Wait for it to be ready
docker-compose ps
```

### 2. Set up database

```bash
# Set the database URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sellzy"

# Push Drizzle schema to create tables
npm run db:push

# Seed database with sample data
npm run db:seed-sql
```

### 3. Verify

```bash
# Check tables were created
psql $DATABASE_URL -c "\dt"

# Expected tables:
# users, sessions, profiles, requests, items, meetings, messages, notifications, transactions
```

## Development Workflow

### Start everything

```bash
# In one terminal: start database
docker-compose up -d

# In another terminal: start app
npm run dev
```

### Stop database

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (use with caution)
docker-compose down -v
```

## Troubleshooting

### Database not ready?

```bash
# Check container logs
docker logs sellzy-postgres

# Restart container
docker-compose restart postgres
```

### Connection issues?

```bash
# Test connection
psql postgresql://postgres:postgres@localhost:5432/sellzy -c "SELECT 1;"
```

### Need to reset database?

```bash
# WARNING: This deletes all data
docker-compose down -v
rm -rf postgres_data
npm run db:push
```

## Notes

- Uses PostgreSQL 16 (same as Replit)
- Data persists in Docker volume `postgres_data`
- No migrations - uses Drizzle push (`npm run db:push`)
- For production, change credentials in `docker-compose.yml` and `.env`
