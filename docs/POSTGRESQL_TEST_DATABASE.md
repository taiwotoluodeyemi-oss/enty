# EVTY temporary Render PostgreSQL test database

## Provisioned resource

- Render workspace: Taiwo's workspace
- Resource: `evty-dev-postgres`
- Resource ID: `dpg-dbrnbejbc2fs73cku450-a`
- Database: `evty_dev_postgres`
- Region: Singapore
- PostgreSQL: 18
- Plan: Free
- Created: 2026-11-13
- Scheduled expiry: 2026-12-13
- Dashboard: https://dashboard.render.com/d/dpg-dbrnbejbc2fs73cku450-a

The Render resource was subsequently confirmed `available`. The API is still not attached and no database credentials have been added to the repository. The PostgreSQL-specific schema and baseline migration have now passed the GitHub Actions PostgreSQL 16 verification job at commit `6275d3df131340264da14f9d87216690518bd6b6`; this verifies the checked-in baseline on a disposable CI database, not on the Render PostgreSQL 18 instance.

A PostgreSQL-specific Prisma schema and clean baseline migration have now been added under `prisma/postgresql/`. They are deliberately separate from the current SQLite schema and migration history. New scripts `db:pg:validate`, `db:pg:generate`, and `db:pg:deploy` target this separate schema. CI now includes a PostgreSQL 16 service job intended to validate the schema and apply the baseline to a fresh database.

This is migration groundwork, not a completed application cutover. The API's default Prisma schema remains SQLite; the PostgreSQL baseline has not yet been executed against the Render database, and the CI result has not been verified. Do not attach the API or enable checkout until that verification and a deliberate runtime cutover are completed.


## Safety boundary

This is a temporary development/test database, not production infrastructure. The free instance is scheduled to expire after 30 days. Do not store production attendee data, live payment records, secrets, or irreplaceable information here. Export any test fixtures/results that must be retained before expiry. Do not assume production-grade backups, high availability, or recovery guarantees.

No application service has been attached to this database, and the API is not yet configured to use it. The repository's Prisma datasource and checked-in migration lock currently target SQLite. Pointing `DATABASE_URL` at this PostgreSQL instance before a reviewed PostgreSQL migration set is committed would cause deployment/migration failure.

## Required migration work before connection

1. Review the complete existing SQLite migration history and current Prisma schema.
2. Convert the Prisma datasource to PostgreSQL and validate all schema features against the pinned Prisma version.
3. Create a clean PostgreSQL baseline migration; preserve the SQLite history in Git rather than silently rewriting shared history. Decide and document whether any existing SQLite data must be exported/imported. The temporary test database is expected to start empty.
4. Update CI to provision PostgreSQL for schema validation, migration deployment, generated client, API tests, and concurrency tests. Keep any SQLite-specific tests explicitly separated or remove SQLite assumptions.
5. Run `prisma migrate deploy` against this temporary database, then verify tables, indexes, constraints, and health checks.
6. Only then wire the Render API service to the database using the internal connection string in the same workspace and region. Never commit a connection string or secret.
7. Before any paid production database is created, review the monthly budget, backup/restore needs, region, connection limits, and operational ownership.

## Cost boundary

The user-approved recurring infrastructure budget is USD 20/month. This temporary database is on Render's Free plan; it is not authorization to create paid services or exceed that budget. Any paid resource or upgrade requires a separate cost review and approval.
