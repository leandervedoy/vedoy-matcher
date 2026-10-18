export const defaultConfig={name:'Gaver til enhver anledning',heading:'Finn en gave med omtanke',color:'#10b981',questions:[{id:'recipient',title:'Hvem er gaven til?',options:[{id:'partner',label:'Kjæresten',tags:['partner','romantic']},{id:'family',label:'Venner & familie',tags:['family','friend']},{id:'colleague',label:'Kollegaer',tags:['colleague','work']},{id:'host',label:'Vertskap',tags:['host','home']}]}]};
const text=(value,max)=>{if(typeof value!=='string'||!value.trim()||value.length>max||/[<>\p{Cc}]/u.test(value))throw new Error('Ugyldig tekst / Invalid text');return value.trim().normalize('NFC');};
export function validateConfig(input){
  if(!input||typeof input!=='object'||!/^#[0-9a-f]{6}$/i.test(input.color))throw new Error('Ugyldig farge / Invalid color');
  if(!Array.isArray(input.questions)||!input.questions.length||input.questions.length>5)throw new Error('Bruk 1–5 spørsmål / Use 1–5 questions');
  const unique=(values)=>new Set(values).size===values.length;
  const questions=input.questions.map(q=>{
    const id=text(q.id,40);if(!/^[a-z0-9-]+$/.test(id))throw new Error('Invalid question ID');
    if(!Array.isArray(q.options)||q.options.length<2||q.options.length>6)throw new Error('Bruk 2–6 svar / Use 2–6 answers');
    const options=q.options.map(o=>{const oid=text(o.id,40);if(!/^[a-z0-9-]+$/.test(oid)||!Array.isArray(o.tags)||o.tags.length>10)throw new Error('Invalid option');return{id:oid,label:text(o.label,80),tags:[...new Set(o.tags.map(t=>text(t,60).toLocaleLowerCase()))]};});
    if(!unique(options.map(o=>o.id)))throw new Error('Duplicate answer ID');
    return{id,title:text(q.title,180),options};
  });
  if(!unique(questions.map(q=>q.id)))throw new Error('Duplicate question ID');
  return{name:text(input.name,100),heading:text(input.heading,120),color:input.color,questions};
}
export function publicConfig(config){const c=validateConfig(config);return{heading:c.heading,color:c.color,questions:c.questions.map(q=>({id:q.id,title:q.title,options:q.options.map(o=>({id:o.id,label:o.label}))}))};}
export function matchProducts(config,answers,products){
  const c=validateConfig(config);const tags=[];
  if(!answers||typeof answers!=='object'||Object.keys(answers).length!==c.questions.length)throw new Error('Answer every question');
  for(const q of c.questions){const option=q.options.find(o=>o.id===answers[q.id]);if(!option)throw new Error('Invalid answer');tags.push(...option.tags);}
  return products.filter(p=>p.active).map(p=>({product:p,score:tags.reduce((score,t)=>score+(p.tags.map(t=>t.toLocaleLowerCase()).includes(t)?1:0),0)})).filter(p=>p.score>0).sort((a,b)=>b.score-a.score||a.product.id.localeCompare(b.product.id)).slice(0,3).map(p=>p.product);
}
