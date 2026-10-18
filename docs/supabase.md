# Matcher on Supabase Postgres

Provisioned target: **Vedoy Matcher**, project ref `grwtbnvoatlnigmmhrqb`, Vedoy organization, Stockholm (`eu-north-1`). The initial migration was applied through Supabase MCP. The application runtime is not connected yet; no database password was retrieved or stored.

Before the first Prisma migration deployment against this already initialized target, baseline its matching local migration with `npx prisma migrate resolve --applied 0_init_matcher --schema prisma/postgres/schema.prisma`, using the configured migration connection. Do not replay the initial CREATE TABLE migration. Then run the normal deploy/verify commands below. The local SQLite preview remains unchanged.

Shopify remains the merchant identity provider. Supabase hosts the server database; no browser Supabase client, Supabase Auth, file storage, or public table policies are needed.

The private `matcher` schema contains installations, encrypted Shopify sessions, quizzes, product cache and webhook receipts. Do not add this schema to the Data API exposed schemas. RLS is enabled with no public policies and grants revoked from PUBLIC, anon and authenticated. Server Prisma connects as the schema owner; tenant access remains enforced through authenticated Shopify shop scopes. Never distribute that database credential to clients.

Choose the Supabase project before applying the migration. Use a dedicated database login owning only the matcher schema, with no CREATEDB, CREATEROLE or BYPASSRLS privileges. Provision its password through the provider's secure dashboard, outside source control. Do not reuse a broad postgres administrator password as the runtime credential.

Copy the exact Connect strings from the selected project. In server environment configuration set DATABASE_URL to the runtime connection and DIRECT_URL to the session pooler (5432) or direct migration connection. Both need `schema=matcher&sslmode=require`; for transaction pooling (6543), DATABASE_URL also needs `pgbouncer=true` and a conservative connection_limit. URL-encode the password. Keep SESSION_ENCRYPTION_KEY independent and backed up securely.

With Node 22 and dependencies installed:

1. Stop the local server before regenerating Prisma on Windows.
2. Run `npm run db:generate:postgres`.
3. Run `npm run db:deploy:postgres` once against the chosen database. Do not run db push/reset or the SQLite setup command against Postgres.
4. Run `npm run db:verify:postgres` to check connection, schema, five tables, RLS and public grants.
5. Build and start the Node app with the same Postgres client/environment. Apply migrations as a release step; the current Dockerfile remains the SQLite pilot image and must not be used for this Postgres release unchanged.

The checked-in Prisma 6 schema intentionally uses datasource directUrl; do not copy Prisma 7 configuration syntax into this pinned application. Migration history is separate from the SQLite migration history. Existing local drafts are not automatically copied. Back up both databases before any deliberate data transfer.

To return to the local preview, restore the file DATABASE_URL, run `npm run setup` to regenerate the SQLite client, then restart preview. Never switch providers while the server is running.

Before public deployment: verify backups and restoration, encrypted session persistence, actual Shopify install/uninstall and token refresh, multi-shop isolation, product sync, signed proxy responses and webhook delivery. A local test suite does not prove hosted connectivity.

Reference: https://supabase.com/docs/guides/database/prisma
