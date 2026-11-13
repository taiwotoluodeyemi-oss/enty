# EVTY database migration and recovery runbook

## Current state

- The Prisma datasource remains SQLite in this repository.
- An initial SQLite migration is now checked in at `prisma/migrations/20261113000100_initial_evty/migration.sql`.
- CI now runs `prisma migrate deploy` against a fresh SQLite database before generating the Prisma client and building the API.
- This is a reproducible fresh-database baseline, not the PostgreSQL production migration.
- No existing database has been inspected, copied, baselined or migrated as part of this change.

## PostgreSQL migration groundwork

A separate PostgreSQL Prisma schema now exists at `prisma/postgresql/schema.prisma`, with its own migration lock and initial baseline at `prisma/postgresql/migrations/20261113000100_initial_evty/migration.sql`. The root `prisma/schema.prisma` and `prisma/migrations/` remain SQLite so existing development workflows are not silently broken.

Available commands:

- `npm run db:pg:validate`
- `npm run db:pg:generate`
- `npm run db:pg:deploy`

The GitHub Actions workflow includes a disposable PostgreSQL service job to validate and apply this baseline. Confirm that job passes before using the Render database. The PostgreSQL schema is currently a parallel migration target; the running API still uses the root SQLite schema/client by default. Do not set the API's `DATABASE_URL` to PostgreSQL until the runtime cutover is implemented and verified.

The Render Free database `evty-dev-postgres` is available for temporary testing and expires on 2026-12-13. Use its private/internal connection string only from a service in the same Render workspace/region. Keep credentials in Render environment settings; never commit them. The hosted database was not directly inspected or migrated during this change.


## Fresh development database

1. Back up any existing local database before changing migration history.
2. Set `DATABASE_URL=file:./dev.db` in the local environment.
3. Run `npm install`.
4. Run `npm run db:deploy`.
5. Run `npm run db:generate`.
6. Run `npm run build` and `npm test`.

Do not run `prisma migrate dev` against production.

## Existing SQLite database warning

If a database was previously created with `prisma db push` or manual SQL and has tables but no `_prisma_migrations` history, running this initial migration can fail with a non-empty-schema error. Do not delete tables or reset the database to make the command pass.

Before baselining an existing database:
1. Take a verified backup and test restoring it to a separate database.
2. Compare its actual schema and data with `prisma/schema.prisma`.
3. Confirm whether the initial migration exactly describes that database.
4. Baseline only after review, using the Prisma version's documented `migrate resolve --applied` procedure.
5. Verify row counts, foreign keys, unique constraints and application read/write behaviour after the change.

If schema or data differs, prepare a reviewed forward migration or an export/import plan instead. Never mark a migration applied merely to suppress an error.

## PostgreSQL production gate

PostgreSQL is the intended production relational database, but the current schema still declares `provider = "sqlite"`. Do not point a PostgreSQL URL at this schema or flip the provider without a reviewed PostgreSQL migration set and a data migration plan.

The PostgreSQL cutover must include:
- a PostgreSQL-specific schema and generated migration history;
- a clean Postgres CI service that runs migrations, Prisma generation, build and tests;
- a repeatable SQLite-to-PostgreSQL export/import or a verified empty-database launch decision;
- staging rehearsal, backup/restore proof, row-count and referential-integrity checks;
- rollback and cutover instructions, with no destructive reset of the existing database.

## Production safety

- Keep database URLs and credentials in the hosting provider's secret manager.
- Never commit a real database URL or paste production credentials into chat.
- Run `npm run db:deploy` only in the controlled deployment pipeline after backup and staging validation.
- `migrate deploy` applies checked-in migrations; it does not generate them.
