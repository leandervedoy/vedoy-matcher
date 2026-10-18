import type { ActionFunctionArgs } from 'react-router';
import { authenticate } from '../shopify.server';
import db from '../db.server';
import { refreshProduct,tombstoneProduct } from '../lib/products.server';
export async function action({request}:ActionFunctionArgs){
  const {shop,topic,payload,admin}=await authenticate.webhook(request);
  const eventId=request.headers.get('x-shopify-event-id');if(!eventId)throw new Response('Event ID required',{status:400});
  if(await db.webhookReceipt.findUnique({where:{shop_eventId:{shop,eventId}}}))return new Response(null,{status:200});
  const id=payload.admin_graphql_api_id||`gid://shopify/Product/${payload.id}`;
  if(!/^gid:\/\/shopify\/Product\/\d+$/.test(id))throw new Response('Invalid product',{status:400});
  if(topic==='PRODUCTS_DELETE')await tombstoneProduct(shop,id);
  else if(admin)await refreshProduct(shop,id,admin);
  else throw new Response('Admin session unavailable',{status:503});
  // Cache refresh is idempotent. A crash before receipt insertion safely refreshes again.
  await db.webhookReceipt.upsert({where:{shop_eventId:{shop,eventId}},create:{shop,eventId},update:{}});
  return new Response(null,{status:200});
}
