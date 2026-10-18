import { PrismaSessionStorage } from '@shopify/shopify-app-session-storage-prisma';
import db from '../db.server';
import { seal,open } from './encryption.mjs';
const base=new PrismaSessionStorage(db);
type Session=Parameters<typeof base.storeSession>[0];
const transform=(session:Session,decrypt=false)=>{const copy=Object.assign(Object.create(Object.getPrototypeOf(session)),session) as Session;const fn=decrypt?open:seal;copy.accessToken=fn(copy.accessToken,process.env.SESSION_ENCRYPTION_KEY);if(copy.refreshToken)copy.refreshToken=fn(copy.refreshToken,process.env.SESSION_ENCRYPTION_KEY);return copy;};
export const encryptedSessions={
  storeSession:(session:Session)=>base.storeSession(transform(session)),
  loadSession:async(id:string)=>{const session=await base.loadSession(id);return session?transform(session,true):undefined;},
  deleteSession:(id:string)=>base.deleteSession(id),
  deleteSessions:(ids:string[])=>base.deleteSessions(ids),
  findSessionsByShop:async(shop:string)=>(await base.findSessionsByShop(shop)).map(s=>transform(s,true)),
};
