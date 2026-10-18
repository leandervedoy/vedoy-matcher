import db from '../db.server';
export const productsQuery=`#graphql
query MatcherProducts($after:String){products(first:100,after:$after,sortKey:ID){nodes{id title handle tags status onlineStoreUrl updatedAt}pageInfo{hasNextPage endCursor}}}`;
export const productQuery=`#graphql
query MatcherProduct($id:ID!){product(id:$id){id title handle tags status onlineStoreUrl updatedAt}}`;
type Admin={graphql:(query:string,options?:any)=>Promise<Response>};
export async function syncBatch(shop:string,admin:Admin,restart=false){
  const installation=await db.installation.upsert({where:{shop},create:{shop},update:{}});
  if(!installation.active)throw new Error('App is not active');
  const now=new Date();
  const lease=new Date(Date.now()+60000);
  const acquired=await db.installation.updateMany({where:{shop,active:true,OR:[{syncLockedUntil:null},{syncLockedUntil:{lt:now}}]},data:{syncLockedUntil:lease}});
  if(!acquired.count)throw new Error('Synkronisering pågår i et annet vindu / Sync already running');
  try{
    let state=await db.installation.findUniqueOrThrow({where:{shop}});
    if(restart||!state.syncStartedAt){state=await db.installation.update({where:{shop},data:{syncCursor:null,syncStartedAt:now}});}
    const response=await admin.graphql(productsQuery,{variables:{after:state.syncCursor}});
    const payload=await response.json() as any;
    if(!response.ok||payload.errors?.length||!payload.data?.products)throw new Error('Shopify kunne ikke synkroniseres / Shopify sync failed');
    const {nodes,pageInfo}=payload.data.products;
    await db.$transaction(async tx=>{
      const current=await tx.installation.findUniqueOrThrow({where:{shop}});
      if(!current.active||current.syncLockedUntil?.getTime()!==lease.getTime())throw new Error('Sync lease expired; retry');
      for(const p of nodes)await writeProduct(tx,shop,p,true);
      if(!pageInfo.hasNextPage){
        await tx.productCache.deleteMany({where:{shop,deleted:false,seenAt:{lt:state.syncStartedAt!}}});
        await tx.installation.update({where:{shop},data:{syncCursor:null,syncStartedAt:null,syncedAt:new Date()}});
      }else{
        if(!pageInfo.endCursor||pageInfo.endCursor===state.syncCursor)throw new Error('Invalid Shopify cursor');
        await tx.installation.update({where:{shop},data:{syncCursor:pageInfo.endCursor}});
      }
    });
    return{hasNext:!!pageInfo.hasNextPage,count:await db.productCache.count({where:{shop,deleted:false}})};
  }finally{await db.installation.updateMany({where:{shop,syncLockedUntil:lease},data:{syncLockedUntil:null}});}
}
export function cacheData(p:any){return{id:p.id,handle:p.handle,title:p.title,tags:JSON.stringify(p.tags||[]),active:p.status==='ACTIVE'&&!!p.onlineStoreUrl,updatedAt:new Date(p.updatedAt)};}
async function writeProduct(tx:any,shop:string,p:any,seen=false){
  const data=cacheData(p);
  const old=await tx.productCache.findUnique({where:{shop_id:{shop,id:p.id}}});
  if(old?.deleted)return;
  if(!old)await tx.productCache.create({data:{shop,...data}});
  else await tx.productCache.updateMany({where:{shop,id:p.id,deleted:false,updatedAt:{lte:data.updatedAt}},data});
  if(seen)await tx.productCache.updateMany({where:{shop,id:p.id},data:{seenAt:new Date()}});
}
export async function tombstoneProduct(shop:string,id:string){return db.productCache.upsert({where:{shop_id:{shop,id}},create:{shop,id,handle:'',title:'',tags:'[]',active:false,deleted:true,updatedAt:new Date()},update:{active:false,deleted:true}});}
export async function refreshProduct(shop:string,id:string,admin:Admin){
  const response=await admin.graphql(productQuery,{variables:{id}});const data=await response.json() as any;
  if(!response.ok||data.errors?.length)throw new Error('Product refresh failed');
  const p=data.data?.product;
  if(!p)return tombstoneProduct(shop,id);
  return db.$transaction(tx=>writeProduct(tx,shop,p));
}
