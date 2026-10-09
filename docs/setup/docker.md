# Local Database with Docker

Runs PostgreSQL 16 in a container for local development. Replaces the older `README-docker.md` and `DOCKER-SETUP-SUMMARY.md`.

## Prerequisites

- Docker, or Orbstack on macOS
- Node.js 20 and `npm install` done

## Container

Defined in `docker-compose.yml`:

| Setting | Value |
|---------|-------|
| Image | `postgres:16-alpine` |
| Container | `sellzy-postgres` |
| Database | `sellzy` |
| User / password | `postgres` / `postgres` (local only) |
| Port | `5432` |
| Data | Docker volume `postgres_data` |

Change the credentials in `docker-compose.yml` and `.env` before any shared or non-local use.

## Option A: Automated setup

```bash
./scripts/setup-docker.sh
```

The script checks Docker, starts the container, waits for it to accept connections, runs `npm run db:push` and `npm run db:seed`, and lists the tables.

## Option B: Manual setup

```bash
npm run docker:up        # start the container
npm run db:push          # create tables from shared/schema.ts
npm run db:seed          # insert demo data
```

## Environment

```bash
cp .env.example .env
```

Set at least:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sellzy
SESSION_SECRET=<openssl rand -hex 32>
```

Then start the app with `npm run dev`. It serves on `http://localhost:5000`.

## Commands

| Command | Effect |
|---------|--------|
| `npm run docker:up` | Start the container in the background |
| `npm run docker:down` | Stop the container, keep data |
| `npm run docker:reset` | Stop, delete the volume, restart, then run `db:seed`. Deletes all data |

`docker:reset` deletes the volume and then seeds with `db:seed` (demo data).

## Checks

```bash
docker-compose ps                                   # container health
psql postgresql://postgres:postgres@localhost:5432/sellzy -c "\dt"
./scripts/check-setup.sh                            # verifies the setup files
```

## Troubleshooting

- Database not ready: `docker logs sellzy-postgres`, then `docker-compose restart postgres`.
- Connection refused: the container is not running. Run `npm run docker:up`.
- Stale sessions after a reseed: `DELETE FROM sessions;`
- Reset everything: `npm run docker:reset` (destructive).
