const test = require('node:test');
const assert = require('node:assert/strict');
const { requireAuth } = require('../src/auth-middleware');

function mockRes() {
  return {
    statusCode: 200, body: undefined, ended: false,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('missing Authorization header returns 401', async () => {
  const req = { get: () => undefined };
  const res = mockRes();
  let called = false;
  await requireAuth(req, res, () => { called = true; });
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: 'Access token required' });
  assert.equal(called, false);
});

test('malformed Authorization header returns 401', async () => {
  const req = { get: () => 'Basic abc123' };
  const res = mockRes();
  await requireAuth(req, res, () => assert.fail('next must not run'));
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: 'Access token required' });
});
