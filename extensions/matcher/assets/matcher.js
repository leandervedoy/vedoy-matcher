(() => {
  if(customElements.get('vedoy-matcher'))return;
  const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;if(className)node.className=className;return node;};
  class Matcher extends HTMLElement {
    async connectedCallback(){
      if(this.started)return;this.started=true;this.view=this.attachShadow({mode:'open'});this.answers={};this.step=0;this.en=(this.dataset.language||'nb').startsWith('en');
      this.root=/^\/(?!\/)[a-zA-Z0-9/-]*$/.test(this.dataset.root||'')?this.dataset.root:'/';if(!this.root.endsWith('/'))this.root+='/';
      const style=el('style');style.textContent=`:host{display:block;max-width:560px;margin:32px auto;font-family:system-ui,sans-serif;color:#25312b}*{box-sizing:border-box}.box{background:#f8faf7;border:1px solid #dee6dd;padding:32px;border-radius:18px}h2{font:400 29px/1.25 Georgia,serif;margin:10px 0 23px}p{font-size:13px;line-height:1.7}button,a{font:inherit}button{cursor:pointer;width:100%;padding:15px 18px;border:1px solid #d3ddd1;background:white;border-radius:9px;text-align:left;margin-bottom:9px;color:inherit}button.selected{border:2px solid var(--matcher-color,#247653);background:#eaf1e7}.next{background:#25312b;color:white;text-align:center;margin-top:17px}.next:disabled{opacity:.4;cursor:default}.back{border:none;background:none;text-align:center;font-size:12px}.eyebrow{font-size:10px;letter-spacing:2px;color:#6b7c6d}.powered{font-size:9px;text-align:center;color:#728274;margin-top:22px}.product{display:flex;gap:16px;align-items:center;padding:14px 0;color:inherit;text-decoration:none;border-bottom:1px solid #dce6db}.product img{width:75px;height:75px;object-fit:cover;border-radius:7px}.product strong{display:block;font-size:14px}.product span{font-size:12px}button:focus-visible,a:focus-visible{outline:3px solid var(--matcher-color,#247653);outline-offset:3px}@media(max-width:480px){.box{padding:23px}h2{font-size:26px}}`;
      this.view.append(style);this.box=el('div',null,'box');this.box.setAttribute('aria-live','polite');this.view.append(this.box);
      try{
        const endpoint=this.dataset.endpoint||'/apps/vedoy-matcher';if(!/^\/apps\/[a-zA-Z0-9/_-]+$/.test(endpoint))throw new Error('Invalid endpoint');
        this.url=new URL(endpoint,location.origin);this.url.searchParams.set('id',this.dataset.matcher||'');this.url.searchParams.set('format','json');
        const data=await this.request(this.url);this.config=data.config;if(!this.config?.questions?.length)throw new Error('Invalid configuration');
        if(/^#[0-9a-f]{6}$/i.test(this.config.color))this.style.setProperty('--matcher-color',this.config.color);this.render();
      }catch{this.box.replaceChildren(el('p',this.en?'This Matcher is not available yet.':'Denne Matcheren er ikke tilgjengelig ennå.'));}
    }
    async request(url){const response=await fetch(url,{credentials:'same-origin',headers:{Accept:'application/json'}});if(!response.ok)throw new Error('Request failed');return response.json();}
    render(){
      this.box.replaceChildren();const q=this.config.questions[this.step];
      this.box.append(el('div',`${this.en?'QUESTION':'SPØRSMÅL'} ${this.step+1} / ${this.config.questions.length}`,'eyebrow'),el('h2',q.title));
      for(const option of q.options){const button=el('button',option.label,this.answers[q.id]===option.id?'selected':'');button.type='button';button.setAttribute('aria-pressed',String(this.answers[q.id]===option.id));button.onclick=()=>{this.answers[q.id]=option.id;this.render();};this.box.append(button);}
      const next=el('button',this.step+1===this.config.questions.length?(this.en?'See my matches →':'Se mine matcher →'):(this.en?'Next →':'Neste →'),'next');next.type='button';next.disabled=!this.answers[q.id];next.onclick=()=>{if(this.step+1<this.config.questions.length){this.step++;this.render();}else this.results();};this.box.append(next);
      if(this.step){const back=el('button',this.en?'Back':'Tilbake','back');back.type='button';back.onclick=()=>{this.step--;this.render();};this.box.append(back);}
      this.box.append(el('div','powered by vedøy matcher','powered'));
    }
    async results(){
      this.box.replaceChildren(el('p',this.en?'Finding your matches…':'Finner dine matcher…'));
      try{
        const url=new URL(this.url);url.searchParams.set('answers',JSON.stringify(this.answers));const data=await this.request(url);const cards=[];
        for(const match of data.products||[]){
          if(!/^[a-z0-9-]+$/.test(match.handle))continue;
          try{const p=await this.request(new URL(`${this.root}products/${match.handle}.js`,location.origin));if(!p.available)continue;
            const link=el('a',null,'product');link.href=`${this.root}products/${match.handle}`;
            if(typeof p.featured_image==='string'){const src=new URL(p.featured_image.startsWith('//')?'https:'+p.featured_image:p.featured_image,location.origin);if(src.protocol==='https:'&&src.hostname==='cdn.shopify.com'){const image=el('img');image.src=src.toString();image.alt='';image.loading='lazy';link.append(image);}}
            const copy=el('div');copy.append(el('strong',p.title));const currency=/^[A-Z]{3}$/.test(this.dataset.currency||'')?this.dataset.currency:'NOK';if(Number.isFinite(p.price))copy.append(el('span',new Intl.NumberFormat(this.en?'en':'nb-NO',{style:'currency',currency}).format(p.price/100)));link.append(copy);cards.push(link);
          }catch{continue;}
        }
        this.box.replaceChildren(el('div',this.en?'YOUR MATCHES':'DINE MATCHER','eyebrow'),el('h2',cards.length?(this.en?'Something that fits.':'Noe som passer.'):(this.en?'No matches this time.':'Ingen treff denne gangen.')),...cards);
        if(!cards.length)this.box.append(el('p',this.en?'Try different answers or browse the store.':'Prøv andre svar, eller se resten av butikken.'));
      }catch{this.box.replaceChildren(el('p',this.en?'Could not load products. Please try again.':'Kunne ikke hente produktene. Prøv igjen.'));}
      const restart=el('button',this.en?'Start again ↻':'Start på nytt ↻','next');restart.type='button';restart.onclick=()=>{this.step=0;this.answers={};this.render();};this.box.append(restart);
    }
  }
  customElements.define('vedoy-matcher',Matcher);
})();
