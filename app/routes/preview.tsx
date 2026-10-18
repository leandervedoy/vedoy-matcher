import type { LoaderFunctionArgs,ActionFunctionArgs } from 'react-router';
import { useLoaderData,useActionData } from 'react-router';
import { workspace,localPreview,saveMatcher } from '../lib/workspace.server';
import Editor from '../components/editor';
export async function loader({request}:LoaderFunctionArgs){localPreview(request);return workspace('local-preview.invalid');}
export async function action({request}:ActionFunctionArgs){localPreview(request);const origin=request.headers.get('origin');if(origin!==new URL(request.url).origin)throw new Response('Forbidden',{status:403});const form=await request.formData();if(form.get('intent')!=='save')return{error:'Connect Shopify to sync or publish. Preview saves drafts only.'};try{const raw=String(form.get('config'));if(raw.length>50000)throw new Error('Quiz too large');const m=await saveMatcher('local-preview.invalid',{id:String(form.get('id')),version:Number(form.get('version')),config:JSON.parse(raw),publish:false});return{saved:true,version:m.version};}catch(e){return{error:e instanceof Error?e.message:'Save failed'};}}
export default function Preview(){const data=useLoaderData<typeof loader>();const result=useActionData<typeof action>();return <Editor data={data} result={result} demo/>;}

export function meta(){return [{title:"Vedøy Matcher · Creator Hub"}];}
