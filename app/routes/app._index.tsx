import type { LoaderFunctionArgs,ActionFunctionArgs } from 'react-router';
import { useLoaderData,useActionData } from 'react-router';
import { authenticate } from '../shopify.server';
import { workspace,saveMatcher } from '../lib/workspace.server';
import { syncBatch } from '../lib/products.server';
import db from '../db.server';
import { defaultConfig } from '../lib/matcher.mjs';
import Editor from '../components/editor';
export async function loader({request}:LoaderFunctionArgs){const {session}=await authenticate.admin(request);return workspace(session.shop,new URL(request.url).searchParams.get('id')||undefined);}
export async function action({request}:ActionFunctionArgs){
  const {session,admin}=await authenticate.admin(request);
  if(Number(request.headers.get('content-length'))>65536)return {error:'Request too large'};
  const body=await request.formData();
  try{
    if(body.get('intent')==='sync'){const result=await syncBatch(session.shop,admin,body.get('restart')==='true');return{sync:result};}
    if(body.get('intent')==='create'){if(await db.matcher.count({where:{shop:session.shop}})>=50)throw new Error('Pilot limit: 50 Matchers per store');const m=await db.matcher.create({data:{shop:session.shop,config:JSON.stringify(defaultConfig)}});return{created:m.id};}
    if(body.get('intent')==='unpublish'){const result=await db.matcher.updateMany({where:{id:String(body.get('id')),shop:session.shop},data:{published:null,version:{increment:1}}});return result.count?{saved:true}:{error:'Matcher not found'};}
    if(body.get('intent')!=='save')return{error:'Invalid action'};
    const raw=String(body.get('config'));if(raw.length>50000)throw new Error('Quiz too large');
    const result=await saveMatcher(session.shop,{id:String(body.get('id')),version:Number(body.get('version')),config:JSON.parse(raw),publish:body.get('publish')==='true'});
    return{saved:true,version:result.version,published:!!result.published};
  }catch(error){return{error:error instanceof Error?error.message:'Request failed'};}
}
export default function Dashboard(){const data=useLoaderData<typeof loader>();const result=useActionData<typeof action>();return <Editor data={data} result={result}/>;}

export function meta(){return [{title:"Vedøy Matcher · Creator Hub"}];}
