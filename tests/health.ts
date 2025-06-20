// test/health.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

test('GET /api/health returns 200 OK', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.text, 'OK');
});
