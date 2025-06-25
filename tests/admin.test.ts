import assert from "assert";
import request from "supertest";
import app from "../app.js";
import db from "../db.js";
import { initDbStatement } from "../utils/initiateDatabase.js";
import { describe, it, before, after } from 'node:test';
import { hashPassword } from "../utils/passwordHash.js";

const TEST_ADMIN_NAME = "testadmin";
const TEST_ADMIN_PASSWORD = "testpassword";
const UPDATED_ADMIN_NAME = "updatedadmin";
const UPDATED_ADMIN_PASSWORD = "updatedpassword";

describe("POST /api/admin/login and PUT /api/admin/:adminId", () => {
  let adminToken: string;
  let adminId: number;

  before(() => {
    // Ensure tables exist
    initDbStatement();
    // Insert a test admin
    const now = new Date().toISOString();
    db.prepare(`DELETE FROM Admin WHERE name = ?`).run(TEST_ADMIN_NAME);
    db.prepare(`
      INSERT INTO Admin (name, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `).run(TEST_ADMIN_NAME, hashPassword(TEST_ADMIN_PASSWORD), now, now);
  });

  after(() => {
    // Remove the test admin(s)
    db.prepare(`DELETE FROM Admin WHERE name = ?`).run(TEST_ADMIN_NAME);
    db.prepare(`DELETE FROM Admin WHERE name = ?`).run(UPDATED_ADMIN_NAME);
  });

  it("should return 200 and a token for valid credentials", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ name: TEST_ADMIN_NAME, password: TEST_ADMIN_PASSWORD });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
    assert.ok(res.body.admin);
    assert.strictEqual(res.body.admin.name, TEST_ADMIN_NAME);

    adminToken = res.body.token;
    adminId = res.body.admin.id;
  });

  it("should update the admin's name and password", async () => {
    const res = await request(app)
      .put(`/api/admin/${adminId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: UPDATED_ADMIN_NAME, password: UPDATED_ADMIN_PASSWORD });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
    assert.ok(res.body.admin);
    assert.strictEqual(res.body.admin.name, UPDATED_ADMIN_NAME);

    // Try logging in with the new credentials
    const loginRes = await request(app)
      .post("/api/admin/login")
      .send({ name: UPDATED_ADMIN_NAME, password: UPDATED_ADMIN_PASSWORD });
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.body.token);
    assert.ok(loginRes.body.admin);
    assert.strictEqual(loginRes.body.admin.name, UPDATED_ADMIN_NAME);
  });

  it("should return 401 for invalid credentials after update", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ name: TEST_ADMIN_NAME, password: TEST_ADMIN_PASSWORD });
    assert.strictEqual(res.status, 401);
    assert.ok(res.body.error);
  });

  it("should return 400 for missing credentials", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ name: TEST_ADMIN_NAME });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error);
  });
});