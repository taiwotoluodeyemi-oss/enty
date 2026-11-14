# Neon PostgreSQL environments

EVTY uses Neon PostgreSQL for disposable demo, development, and preview databases. Keep the production database on a separate Neon project or, at minimum, a separate protected branch with separate credentials.

## Environment layout

| EVTY environment | Neon target | Data policy |
|---|---|---|
| Local/demo | Dedicated Neon demo/development branch | Synthetic fixtures only; safe to reset |
| CI/preview | Short-lived branch per test run or PR | Isolated fixtures; never copy production personal data |
| Production | Protected production branch/project | Real customer and financial records; no demo seed/reset |

Neon branches are isolated PostgreSQL branches with independent connection strings. Use that isolation to test schema changes and demo data without touching production.

## Render API variables

Set these in the Render API service's environment settings:

- `DATABASE_URL`: Neon pooled connection string (hostname includes `-pooler`) for normal API traffic.
- `DIRECT_URL`: Neon direct/unpooled connection string for Prisma migrations and administrative schema work.
- `DATABASE_ENV=demo` for the demo service, `DATABASE_ENV=production` only for the production service.
- `ALLOW_DEMO_SEED=true` only on the isolated demo service.

Never commit connection strings or passwords. Do not send them in chat. Add them directly to Render's secret environment settings.

## Runtime and migration rules

1. The API uses `DATABASE_URL` for normal Prisma queries; Prisma Migrate uses `DIRECT_URL`.
2. Run `npm run db:pg:validate`, `npm run db:pg:generate`, and `npm run db:pg:deploy` against the intended environment before starting a release.
3. Use the pooled URL for the long-running web API and the direct URL for migrations. Do not run migrations through the pooler.
4. The demo seeder must refuse to run unless `DATABASE_ENV=demo` and `ALLOW_DEMO_SEED=true`. Production must reject demo seeding and destructive reset commands.
5. Keep demo and production credentials separate. Never point a demo service at a production branch.
6. Validate backups and restore into a disposable branch before any production migration with destructive potential.

## Credential activation

When Neon credentials are added to Render, the service should consume them on its next deploy/restart. The deployment must validate connectivity and schema state before declaring readiness. Missing or invalid credentials must fail closed with a sanitized diagnostic; never log the connection string.

Neon credentials are not currently available in this repository or Render configuration. The project can be prepared for Neon, but the database cannot be connected until the owner supplies the pooled and direct connection strings in Render.

## References

- [Connect an application using a Neon connection string](https://neon.com/docs/connect/connect-from-any-app)
- [Neon connection pooling](https://neon.com/docs/connect/connection-pooling)
- [Neon branching workflow](https://neon.com/docs/get-started/workflow-primer)
