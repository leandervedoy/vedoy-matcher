import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,readFileSync,readdirSync,unlinkSync,rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
const temp=mkdtempSync(path.join(tmpdir(),'vedoy-matcher-test-'));
const file=path.join(temp,'test.sqlite');const sqlite=new DatabaseSync(file);
for(const migration of readdirSync(new URL('../prisma/migrations/',import.meta.url)).filter(s=>/^\d/.test(s)).sort())sqlite.exec(readFileSync(new URL(`../prisma/migrations/${migration}/migration.sql`,import.meta.url),'utf8'));
sqlite.close();process.env.DATABASE_URL=`file:${file.replaceAll('\\','/')}`;
const {default:db}=await import('../app/db.server');
const {workspace,saveMatcher,localPreview}=await import('../app/lib/workspace.server');
const {syncBatch,refreshProduct,tombstoneProduct}=await import('../app/lib/products.server');
after(async()=>{await db.$disconnect();for(const entry of readdirSync(temp))unlinkSync(path.join(temp,entry));rmdirSync(temp);});
test('tenant-scoped draft updates cannot modify another merchant',async()=>{
  const a=await workspace('a.myshopify.com');const b=await workspace('b.myshopify.com');
  await assert.rejects(saveMatcher('b.myshopify.com',{id:a.matcher.id,version:a.matcher.version,config:a.matcher.config,publish:false}));
  assert.notEqual(a.matcher.id,b.matcher.id);
});
test('published snapshots stay stable while the draft changes',async()=>{
  const shop='publish.myshopify.com';const w=await workspace(shop);
  await db.installation.create({data:{shop,active:true,syncedAt:new Date()}});
  await db.productCache.create({data:{shop,id:'gid://shopify/Product/1',handle:'mug',title:'Mug',tags:'["partner"]',active:true,updatedAt:new Date()}});
  const published=await saveMatcher(shop,{id:w.matcher.id,version:0,config:w.matcher.config,publish:true});
  const draft={...w.matcher.config,heading:'Nytt utkast'};
  await saveMatcher(shop,{id:w.matcher.id,version:published.version,config:draft,publish:false});
  const result=await db.matcher.findUniqueOrThrow({where:{id:w.matcher.id}});
  assert.notEqual(JSON.parse(result.config).heading,JSON.parse(result.published!).heading);
  await assert.rejects(saveMatcher(shop,{id:w.matcher.id,version:0,config:draft,publish:false}));
});
test('pagination keeps older catalog rows until a full sync finishes',async()=>{
  const shop='sync.myshopify.com';await db.productCache.create({data:{shop,id:'old',handle:'old',title:'Old',tags:'[]',active:true,updatedAt:new Date(0),seenAt:new Date(0)}});
  let page=0;const admin={graphql:async()=>Response.json({data:{products:{nodes:[{id:`gid://shopify/Product/${++page}`,handle:`p-${page}`,title:`P ${page}`,tags:['partner'],status:'ACTIVE',onlineStoreUrl:'https://example.test/products/p',updatedAt:new Date().toISOString()}],pageInfo:{hasNextPage:page===1,endCursor:page===1?'next':null}}}})};
  assert.equal((await syncBatch(shop,admin,true)).hasNext,true);
  assert.ok(await db.productCache.findUnique({where:{shop_id:{shop,id:'old'}}}));
  assert.equal((await syncBatch(shop,admin)).hasNext,false);
  assert.equal(await db.productCache.findUnique({where:{shop_id:{shop,id:'old'}}}),null);
});
test('a fetched sync page cannot overwrite a newer webhook update',async()=>{
  const shop='race.myshopify.com';const id='gid://shopify/Product/9';
  const admin={graphql:async()=>{await db.productCache.upsert({where:{shop_id:{shop,id}},create:{shop,id,handle:'new',title:'New',tags:'["new"]',active:false,updatedAt:new Date('2026-10-16T12:00:00Z')},update:{}});return Response.json({data:{products:{nodes:[{id,handle:'old',title:'Old',tags:['old'],status:'ACTIVE',onlineStoreUrl:'https://example.test/products/old',updatedAt:'2026-10-15T12:00:00Z'}],pageInfo:{hasNextPage:false,endCursor:null}}}});}};
  await syncBatch(shop,admin,true);
  const p=await db.productCache.findUniqueOrThrow({where:{shop_id:{shop,id}}});assert.equal(p.title,'New');assert.equal(p.active,false);
});
test('a deleted product cannot be resurrected by an old refresh response',async()=>{
  const shop='delete.myshopify.com',id='gid://shopify/Product/77';await tombstoneProduct(shop,id);
  const admin={graphql:async()=>Response.json({data:{product:{id,handle:'gone',title:'Gone',tags:['partner'],status:'ACTIVE',onlineStoreUrl:'https://example.test/products/gone',updatedAt:'2026-10-15T00:00:00Z'}}})};
  await refreshProduct(shop,id,admin);const row=await db.productCache.findUniqueOrThrow({where:{shop_id:{shop,id}}});assert.equal(row.deleted,true);assert.equal(row.active,false);
});
test('expired sync owners cannot commit or release another owner’s lease',async()=>{
  const shop='lease.myshopify.com';const newerLease=new Date(Date.now()+180000);
  const admin={graphql:async()=>{await db.installation.update({where:{shop},data:{syncLockedUntil:newerLease}});return Response.json({data:{products:{nodes:[],pageInfo:{hasNextPage:false,endCursor:null}}}});}};
  await assert.rejects(syncBatch(shop,admin,true),/lease expired/);
  assert.equal((await db.installation.findUniqueOrThrow({where:{shop}})).syncLockedUntil?.getTime(),newerLease.getTime());
});
test('local preview remains inaccessible in production even with its flag enabled',()=>{
  const oldNode=process.env.NODE_ENV,oldPreview=process.env.ALLOW_LOCAL_PREVIEW;
  process.env.NODE_ENV='production';process.env.ALLOW_LOCAL_PREVIEW='true';
  try{assert.throws(()=>localPreview(new Request('http://127.0.0.1/preview')),error=>error instanceof Response&&error.status===404);}finally{if(oldNode===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldNode;if(oldPreview===undefined)delete process.env.ALLOW_LOCAL_PREVIEW;else process.env.ALLOW_LOCAL_PREVIEW=oldPreview;}
});
