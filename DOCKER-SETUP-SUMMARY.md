# Docker Setup Summary

## What Was Created

### 1. Docker Compose Configuration (`docker-compose.yml`)
- PostgreSQL 16 container with Alpine image (lightweight)
- Persistent volume for data storage
- Health checks for readiness
- Default credentials: user=`postgres`, password=`postgres`, db=`sellzy`

### 2. Environment Configuration (`.env.local`)
- Example environment file with DATABASE_URL
- Includes all required variables
- Ready to copy to `.env`

### 3. Setup Script (`script/setup-docker.sh`)
- Automated setup process
- Checks Docker availability
- Starts PostgreSQL container
- Waits for database readiness
- Pushes Drizzle schema
- Seeds database with sample data from dump.sql
- Verifies table creation and data
- Provides next steps

### 4. Package.json Updates
- Added `docker:up` - Start Docker containers
- Added `docker:down` - Stop Docker containers
- Added `docker:reset` - Reset database and seed (deletes all data)
- Added `db:seed-sql` - Seed database from dump.sql

### 5. Documentation
- `README.md` - Main documentation with Docker quick start
- `README-docker.md` - Detailed Docker documentation
- `DOCKER-SETUP-SUMMARY.md` - This file
- `script/seed-database.sh` - Database seeding script

## Quick Start

```bash
# 1. Start the database and setup schema
./script/setup-docker.sh

# 2. Copy environment file
cp .env.local .env

# 3. Generate session secret
openssl rand -hex 32  # Copy to SESSION_SECRET in .env

# 4. Start the app
npm run dev
```

## Usage

### Start database
```bash
npm run docker:up
```

### Stop database
```bash
npm run docker:down
```

### Reset database (WARNING: deletes all data)
```bash
npm run docker:reset
```

### Push schema manually
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sellzy" npm run db:push
```

## Database Seeding

The database can be seeded with sample data from `dump.sql`:

```bash
# Seed the database
npm run db:seed-sql

# Or as part of the full setup
./script/setup-docker.sh

# Reset and reseed (WARNING: deletes all data)
npm run docker:reset
```

## Database Access

### Connect with psql
```bash
psql postgresql://postgres:postgres@localhost:5432/sellzy
```

### View tables
```bash
psql postgresql://postgres:postgres@localhost:5432/sellzy -c "\dt"
```

### Run queries
```bash
psql postgresql://postgres:postgres@localhost:5432/sellzy -c "SELECT * FROM users LIMIT 5;"
```

## Docker Commands

### View running containers
```bash
docker-compose ps
```

### View logs
```bash
docker-compose logs -f postgres
```

### Exec into container
```bash
docker-compose exec postgres bash
```

### Connect to PostgreSQL directly
```bash
docker-compose exec postgres psql -U postgres -d sellzy
```

## Troubleshooting

### Database not ready?
```bash
docker-compose restart postgres
```

### Connection refused?
```bash
docker-compose logs postgres
```

### Need to reset?
```bash
docker-compose down -v
rm -rf postgres_data
npm run docker:up
npm run db:push
```

## Notes

- Uses PostgreSQL 16 (same as Replit)
- Data persists in Docker volume `postgres_data`
- No migrations - uses Drizzle push
- Credentials are default for development only
- For production, change credentials in `docker-compose.yml` and `.env`
- Orbstack is required for Docker runtime

## Files Modified/Created

```
.
├── docker-compose.yml (NEW)
├── .env.local (NEW)
├── README.md (NEW)
├── README-docker.md (NEW)
├── DOCKER-SETUP-SUMMARY.md (NEW)
├── package.json (MODIFIED)
├── script/
│   ├── setup-docker.sh (NEW)
│   └── build.ts (EXISTING)
└── test-docker-setup.sh (NEW - for verification)
```

## Next Steps

1. Run `./script/setup-docker.sh` to start the database
2. Copy `.env.local` to `.env`
3. Generate a SESSION_SECRET
4. Start the app with `npm run dev`
5. Access the app at `http://localhost:5000`
