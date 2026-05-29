# Sellzy - Fashion Resale Marketplace

> Connecting clothing sellers with expert resellers (Reusses)
> Commission split: 80% seller / 20% Reusse

## 🚀 Quick Start with Docker

This project uses Docker for local PostgreSQL development. With Orbstack already installed, you can get started quickly:

### 1. Start the database and seed with sample data

```bash
# Using the setup script (recommended)
./script/setup-docker.sh

# Or manually:
npm run docker:up
npm run db:push
npm run db:seed-sql
```

### 2. Set up environment

```bash
# Copy the example environment file
cp .env.local .env

# Generate a session secret (required)
openssl rand -hex 32  # Copy this output to SESSION_SECRET in .env
```

### 3. Start the application

```bash
npm run dev
```

Your app will be available at `http://localhost:5000`

## 📋 Local Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run check` | Type checking |
| `npm run db:push` | Push Drizzle schema to database |
| `npm run db:seed` | Seed database with French test dataset (Drizzle ORM) |
| `npm run db:seed-sql` | Seed database from dump.sql |
| `npm run docker:up` | Start Docker containers |
| `npm run docker:down` | Stop Docker containers |
| `npm run docker:reset` | Reset database and seed (deletes all data) |

## 🐳 Docker Setup

See [README-docker.md](README-docker.md) for detailed Docker documentation.

## 🗃️ Database

- **ORM:** Drizzle ORM with PostgreSQL (exclusive ORM, no Prisma)
- **Schema:** Defined in `shared/schema.ts` (single source of truth)
- **Tables:** 9 tables (users, sessions, profiles, requests, items, meetings, messages, notifications, transactions)
- **Seeding:** `npm run db:seed` uses Drizzle ORM for test data creation

### Database Schema

All tables are created automatically when you run `npm run db:push`.

### Database Seeding

The project uses Drizzle ORM exclusively for both runtime queries and seeding. To seed with test data (3 admin users, 5 sellers, 3 marchands, sample requests and items with French data):

```bash
npm run db:seed
```

**Note:** The seed script is idempotent — running it multiple times will delete and recreate the test data.

## 🔐 Authentication

Uses Replit OIDC (OpenID Connect) via Passport.js. For local development, you may need to mock the auth system.

## 🌐 API Endpoints

31 API endpoints covering authentication, profiles, requests, items, meetings, messages, notifications, admin, and earnings.

## 🎨 Frontend

- React 18 with TypeScript
- Vite for bundling
- shadcn/ui component library
- Tailwind CSS for styling
- wouter for routing

## 📦 Backend

- Express 5
- TypeScript
- Drizzle ORM
- PostgreSQL

## 📚 Documentation

- [Docker Setup](README-docker.md) - Detailed Docker documentation
- [replit.md](replit.md) - Replit-specific documentation
- [AGENTS.md](AGENTS.md) - Agent configuration

## 🛠️ Local Database Setup Options

### Option A: Docker (Recommended)

```bash
./script/setup-docker.sh
```

### Option B: Native PostgreSQL

```bash
# Install PostgreSQL 16
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb sellzy

# Set connection string
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/sellzy"

# Push schema
npm run db:push
```

### Option C: From Replit

See the "Local Database Setup" section in the project context for instructions on exporting data from Replit.

## 🔧 Environment Variables

Required variables:

```
DATABASE_URL=postgresql://user:password@host:port/dbname
SESSION_SECRET=your-32-character-hex-secret
PORT=5000
NODE_ENV=development
```

## 📝 Notes

- This project uses Drizzle **push** (not migrations)
- Replit Auth only works in Replit environment
- For local development, you may need to implement a mock auth strategy
- All database operations go through `server/storage.ts` interface
