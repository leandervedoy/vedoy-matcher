import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const good = 'postgresql://matcher:placeholder@localhost:5432/postgres?schema=matcher&sslmode=require';
function guard(database, direct = good) {
  return spawnSync(process.execPath, ['scripts/check-postgres.mjs'], { env: { ...process.env, DATABASE_URL: database, DIRECT_URL: direct }, encoding: 'utf8' });
}
test('Postgres setup rejects public schema, missing TLS and transaction migration connections', () => {
  assert.equal(guard(good).status, 0);
  for (const value of [good.replace('schema=matcher','schema=public'), good.replace('&sslmode=require',''), 'file:./dev.sqlite']) assert.notEqual(guard(value).status, 0);
  assert.notEqual(guard(good, good.replace(':5432', ':6543')).status, 0);
});
test('Postgres schema retains the SQLite models and protects every application table', () => {
  const local = readFileSync('prisma/schema.prisma','utf8').split('model ').slice(1);
  const pg = readFileSync('prisma/postgres/schema.prisma','utf8').split('model ').slice(1);
  assert.deepEqual(pg, local);
  const migration = readFileSync('prisma/postgres/migrations/0_init_matcher/migration.sql','utf8');
  for (const table of ['Session','Installation','Matcher','ProductCache','WebhookReceipt']) {
    assert.ok(migration.includes(`ALTER TABLE "matcher"."${table}" ENABLE ROW LEVEL SECURITY`));
    assert.ok(migration.includes(`REVOKE ALL ON TABLE "matcher"."${table}" FROM PUBLIC, anon, authenticated`));
  }
});
