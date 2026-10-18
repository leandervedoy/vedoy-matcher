import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
try {
  const rows = await db.$queryRaw`SELECT current_schema() AS schema`;
  if (rows[0]?.schema !== 'matcher') throw new Error('Wrong database schema');
  const tables = await db.$queryRaw`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'matcher' AND tablename IN ('Session','Installation','Matcher','ProductCache','WebhookReceipt')`;
  if (tables.length !== 5 || tables.some(t => !t.rowsecurity)) throw new Error('Missing tables or RLS');
  const grants = await db.$queryRaw`SELECT table_name FROM information_schema.role_table_grants WHERE table_schema = 'matcher' AND grantee IN ('anon','authenticated','PUBLIC')`;
  if (grants.length) throw new Error('Unexpected public database grants');
  console.log('Matcher Postgres connection, schema, five tables, RLS and API grants verified.');
} catch {
  console.error('Matcher Postgres verification failed. Check server credentials, generated client and migrations.');
  process.exitCode = 1;
} finally { await db.$disconnect(); }
