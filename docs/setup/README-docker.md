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

# Run Prisma migrations to create tables
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### 3. Verify

```bash
# Check tables were created
psql $DATABASE_URL -c "\dt"

# Expected tables:
# _prisma_migrations, users, sessions, profiles, requests, items, meetings, messages, notifications, transactions
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

## Prisma Commands

| Command | Purpose |
|---------|---------|
| `npm run db:migrate` | Apply pending migrations (interactive, dev only) |
| `npm run db:migrate:reset` | Drop and re-apply all migrations (destructive) |
| `npm run db:generate` | Regenerate Prisma Client types from schema |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:seed` | Run `prisma/seed.ts` to seed the database |
| `npm run docker:reset` | Full reset: wipe volume, restart container, migrate, seed |

### PrismaClient setup (Prisma 7)

Prisma 7 requires a driver adapter. Use `@prisma/adapter-pg`:

```typescript
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })
```

The `prisma.config.ts` at the project root configures the datasource URL — no `url` field is needed in `prisma/schema.prisma`.

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
npm run docker:reset
```

## Notes

- Uses PostgreSQL 16 (same as Replit)
- Data persists in Docker volume `postgres_data`
- Uses Prisma migrations (`npm run db:migrate`) — migration files live in `prisma/migrations/`
- For production, change credentials in `docker-compose.yml` and `.env`
