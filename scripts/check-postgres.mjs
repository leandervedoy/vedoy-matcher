export function checkPostgres(env = process.env) {
  for (const name of ['DATABASE_URL', 'DIRECT_URL']) {
    let url;
    try { url = new URL(env[name]); } catch { throw new Error(`Configure server-only ${name}`); }
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.searchParams.get('schema') !== 'matcher') {
      throw new Error(`${name} must target Postgres with schema=matcher`);
    }
    if (url.searchParams.get('sslmode') !== 'require') throw new Error(`${name} must use sslmode=require`);
    if (name === 'DIRECT_URL' && url.port === '6543') throw new Error('Migrations require a session pooler or direct connection');
  }
  const a = new URL(env.DATABASE_URL), b = new URL(env.DIRECT_URL);
  if (a.username !== b.username || a.pathname !== b.pathname) throw new Error('Runtime and migration database identities differ');
}
checkPostgres();
