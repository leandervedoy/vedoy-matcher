import type { LoaderFunctionArgs } from 'react-router';
import { authenticate } from '../shopify.server';
import db from '../db.server';
import { publicConfig,matchProducts } from '../lib/matcher.mjs';
export async function loader({request}:LoaderFunctionArgs){
  const {session,liquid}=await authenticate.public.appProxy(request);
  if(!session)throw new Response('App not installed',{status:401});
  const shop=session.shop;const url=new URL(request.url);const id=url.searchParams.get('id')||'';
  if(!/^[a-z0-9]{10,60}$/.test(id))throw new Response('Invalid Matcher ID',{status:400});
  const installed=await db.installation.findUnique({where:{shop}});
  if(!installed?.active)throw new Response('App not active',{status:404});
  const matcher=await db.matcher.findFirst({where:{id,shop,published:{not:null}}});
  if(!matcher?.published)throw new Response('Matcher not published',{status:404});
  if(url.searchParams.get('format')!=='json'){
    const appOrigin=new URL(process.env.SHOPIFY_APP_URL!).origin;
    if(!appOrigin.startsWith('https://'))throw new Response('HTTPS app origin required',{status:503});
    const escapedOrigin=appOrigin.replaceAll('&','&amp;').replaceAll('"','&quot;');
    // Generated IDs contain only alphanumeric characters; no customer text is inserted into Liquid/HTML.
    return liquid(`<vedoy-matcher data-endpoint="{{ request.path | escape }}" data-matcher="${id}" data-root="{{ routes.root_url }}" data-language="{{ request.locale.iso_code }}" data-currency="{{ cart.currency.iso_code }}"></vedoy-matcher><script src="${escapedOrigin}/matcher-widget.js" defer></script>`);
  }
  const config=JSON.parse(matcher.published);
  const raw=url.searchParams.get('answers');
  if(!raw)return Response.json({config:publicConfig(config)},{headers:{'Cache-Control':'no-store'}});
  if(raw.length>2000)throw new Response('Answers too large',{status:400});
  let answers;try{answers=JSON.parse(raw);}catch{throw new Response('Invalid answers',{status:400});}
  const products=await db.productCache.findMany({where:{shop,active:true},take:5000});
  try{
    const matches=matchProducts(config,answers,products.map(p=>({...p,tags:JSON.parse(p.tags)})));
    return Response.json({products:matches.map((p:any)=>({handle:p.handle}))},{headers:{'Cache-Control':'no-store'}});
  }catch{throw new Response('Invalid answers',{status:400});}
}
