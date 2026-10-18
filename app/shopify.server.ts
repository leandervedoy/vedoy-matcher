import '@shopify/shopify-app-react-router/adapters/node';
import { ApiVersion, AppDistribution, shopifyApp } from '@shopify/shopify-app-react-router/server';
import { encryptedSessions } from './lib/sessions.server';
import db from './db.server';
let instance:ReturnType<typeof shopifyApp>|undefined;
export function configured(){return !!process.env.SHOPIFY_API_KEY&&!!process.env.SHOPIFY_API_SECRET&&!!process.env.SHOPIFY_APP_URL&&!!process.env.SESSION_ENCRYPTION_KEY;}
function client(){
  if(!configured())throw new Response('Matcher is not connected to a Shopify development app yet.',{status:503});
  return instance??=shopifyApp({apiKey:process.env.SHOPIFY_API_KEY!,apiSecretKey:process.env.SHOPIFY_API_SECRET!,apiVersion:ApiVersion.October26,scopes:['read_products','write_app_proxy'],appUrl:process.env.SHOPIFY_APP_URL!,authPathPrefix:'/auth',sessionStorage:encryptedSessions,distribution:AppDistribution.AppStore,future:{expiringOfflineAccessTokens:true},hooks:{afterAuth:async({session})=>{await db.installation.upsert({where:{shop:session.shop},create:{shop:session.shop},update:{active:true}});}}});
}
export const authenticate={admin:(request:Request)=>client().authenticate.admin(request),webhook:(request:Request)=>client().authenticate.webhook(request),public:{appProxy:(request:Request)=>client().authenticate.public.appProxy(request)}};
export const login=(request:Request)=>client().login(request);
export const addDocumentResponseHeaders=(request:Request,headers:Headers)=>{if(configured())client().addDocumentResponseHeaders(request,headers);};
export const apiVersion=ApiVersion.October26;
