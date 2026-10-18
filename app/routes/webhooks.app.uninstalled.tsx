import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  await db.$transaction([
    db.session.deleteMany({where:{shop}}),
    db.matcher.updateMany({where:{shop},data:{published:null}}),
    db.installation.updateMany({where:{shop},data:{active:false}}),
  ]);

  return new Response();
};
