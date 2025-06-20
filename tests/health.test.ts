import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

describe("GET /health", () => {
  it('should return 200 OK', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.text, 'OK');
  });
})

