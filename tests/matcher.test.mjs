import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig, matchProducts, publicConfig, defaultConfig } from '../app/lib/matcher.mjs';
test('quiz validation supports Norwegian and rejects unsafe or duplicate settings',()=>{
  assert.equal(validateConfig(defaultConfig).questions[0].title,'Hvem er gaven til?');
  assert.throws(()=>validateConfig({...defaultConfig,color:'javascript:alert(1)'}));
  assert.throws(()=>validateConfig({...defaultConfig,questions:[defaultConfig.questions[0],defaultConfig.questions[0]]}));
});
test('matching uses selected option tags and only public active products',()=>{
  const config=validateConfig(defaultConfig);
  const products=[{id:'1',handle:'a',title:'A',tags:['partner'],active:true},{id:'2',handle:'b',title:'B',tags:['family'],active:true},{id:'3',handle:'c',title:'C',tags:['partner'],active:false}];
  assert.equal(matchProducts(config,{'recipient':'partner'},products)[0].handle,'a');
  assert.equal(matchProducts(config,{'recipient':'partner'},products).some(p=>p.handle==='c'),false);
  assert.throws(()=>matchProducts(config,{'recipient':'made-up'},products));
  assert.throws(()=>matchProducts(config,{},products));
});
test('public quiz configuration does not reveal matching rules',()=>{
  const safe=publicConfig(defaultConfig);
  assert.equal(safe.questions[0].options[0].tags,undefined);
  assert.ok(safe.questions[0].options[0].label);
});
