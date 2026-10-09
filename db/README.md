# Database: seed and backups

Everything about the database lives here or in the scripts it points to.

```
db/
  backups/        SQL dumps (git-ignored, contain personal data)
scripts/
  restore-db.sh   loads DB_SEED_FILE into DATABASE_URL
  seed-admin.ts   promotes a user to admin
server/seed.ts    demo data (npm run db:seed)
shared/schema.ts  schema (npm run db:push)
```

## Commands

| Command | What it does |
|---------|--------------|
| `npm run db:push` | Create or update tables from `shared/schema.ts` |
| `npm run db:seed` | Insert demo data (idempotent) |
| `npm run db:seed:admin -- <USER_ID>` | Set a user's profile role to admin |
| `npm run db:restore` | Load the dump at `DB_SEED_FILE` into `DATABASE_URL` |

## Backup from Replit

```bash
pg_dump "$DATABASE_URL" --no-owner --no-privileges > db/backups/sellzy_$(date +%Y%m%d_%H%M%S).sql
```

## Restore locally

1. Put the dump in `db/backups/`.
2. Set `DB_SEED_FILE` in `.env` to its path, for example `./db/backups/sellzy_20261009_120000.sql`.
3. Run `npm run db:push` and then `npm run db:restore`.

`db:restore` loads on top of existing data. For a clean database, run `npm run docker:reset` first, then `npm run db:restore`.
