import db from '../db.server';
import { defaultConfig,validateConfig } from './matcher.mjs';
export async function workspace(shop:string,id?:string){
  let matchers=await db.matcher.findMany({where:{shop},orderBy:{updatedAt:'desc'},take:50});
  if(!matchers.length){await db.matcher.create({data:{shop,config:JSON.stringify(defaultConfig)}});matchers=await db.matcher.findMany({where:{shop},orderBy:{updatedAt:'desc'}});}
  const matcher=matchers.find(m=>m.id===id)||matchers[0];
  const products=await db.productCache.findMany({where:{shop,deleted:false},orderBy:{title:'asc'},take:500});
  const installation=await db.installation.findUnique({where:{shop}});
  return{shop,matchers:matchers.map(m=>({id:m.id,name:JSON.parse(m.config).name})),matcher:{...matcher,updatedAt:matcher.updatedAt.toISOString(),config:JSON.parse(matcher.config)},products:products.map(p=>({...p,updatedAt:p.updatedAt.toISOString(),seenAt:p.seenAt.toISOString(),tags:JSON.parse(p.tags)})),syncedAt:installation?.syncedAt?.toISOString()||null,productCount:await db.productCache.count({where:{shop,deleted:false}})};
}
export async function saveMatcher(shop:string,input:{id:string;version:number;config:unknown;publish:boolean}){
  const config=validateConfig(input.config);
  if(input.publish){
    const installation=await db.installation.findUnique({where:{shop}});
    if(!installation?.active||!installation.syncedAt||installation.syncStartedAt)throw new Error('Fullfør produktsynkronisering før publisering / Complete product sync before publishing');
    if(!(await db.productCache.count({where:{shop,active:true}})))throw new Error('Ingen publiserte produkter / No published products');
    if((await db.productCache.count({where:{shop,active:true}}))>5000)throw new Error('Piloten støtter opptil 5000 aktive produkter / Pilot supports up to 5000 active products');
  }
  const result=await db.matcher.updateMany({where:{id:input.id,shop,version:input.version},data:{config:JSON.stringify(config),...(input.publish?{published:JSON.stringify(config)}:{}),version:{increment:1}}});
  if(!result.count)throw new Error('Utkastet er endret i et annet vindu. Last inn på nytt / Draft changed in another window; reload');
  return db.matcher.findFirstOrThrow({where:{id:input.id,shop}});
}
export function localPreview(request:Request){const url=new URL(request.url);if(process.env.NODE_ENV==='production'||process.env.ALLOW_LOCAL_PREVIEW!=='true'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw new Response('Not found',{status:404});}
