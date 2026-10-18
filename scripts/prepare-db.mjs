import { mkdir,open } from 'node:fs/promises';
import path from 'node:path';
const value=process.env.DATABASE_URL;
if(!value?.startsWith('file:'))throw new Error('Configure the SQLite DATABASE_URL before starting the pilot.');
const configured=value.slice(5);
const file=path.isAbsolute(configured)?configured:path.resolve('prisma',configured);
await mkdir(path.dirname(file),{recursive:true});
await (await open(file,'a')).close();
