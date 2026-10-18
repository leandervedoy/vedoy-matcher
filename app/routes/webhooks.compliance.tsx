import type { ActionFunctionArgs } from 'react-router';
import { authenticate } from '../shopify.server';
import db from '../db.server';
export async function action({request}:ActionFunctionArgs){
  const {shop,topic}=await authenticate.webhook(request);
  if(topic==='SHOP_REDACT')await db.$transaction([db.matcher.deleteMany({where:{shop}}),db.productCache.deleteMany({where:{shop}}),db.installation.deleteMany({where:{shop}}),db.session.deleteMany({where:{shop}}),db.webhookReceipt.deleteMany({where:{shop}})]);
  // No customer identifiers, email addresses or quiz responses are retained by Matcher.
  return Response.json({acknowledged:true,customer_data_stored:false});
}
