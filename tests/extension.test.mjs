import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('theme block settings are unique and the shared widget assets agree',async()=>{
  const liquid=await readFile(new URL('../extensions/matcher/blocks/matcher.liquid',import.meta.url),'utf8');
  const schema=JSON.parse(liquid.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
  const ids=schema.settings.map(s=>s.id);
  assert.equal(ids.length,new Set(ids).size);assert.equal(schema.target,'section');
  assert.equal(await readFile(new URL('../extensions/matcher/assets/matcher.js',import.meta.url),'utf8'),await readFile(new URL('../public/matcher-widget.js',import.meta.url),'utf8'));
});
