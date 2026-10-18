import test from 'node:test';
import assert from 'node:assert/strict';
import { seal, open } from '../app/lib/encryption.mjs';
const key=Buffer.alloc(32,7).toString('base64');
test('access tokens are encrypted at rest and authenticated',()=>{
  const encrypted=seal('not-a-real-provider-token',key);
  assert.ok(!encrypted.includes('not-a-real-provider-token'));
  assert.equal(open(encrypted,key),'not-a-real-provider-token');
  assert.throws(()=>open(encrypted,Buffer.alloc(32,8).toString('base64')));
  assert.throws(()=>open('plaintext',key));
  assert.throws(()=>seal('token',''));
});
