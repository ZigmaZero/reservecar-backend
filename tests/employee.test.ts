import assert from "assert";
import request from "supertest";
import app from "../app.js";
import db from "../db.js";
import { initDbStatement } from "../utils/initiateDatabase.js";
import { hashPassword } from "../utils/passwordHash.js";
import { describe, it, before, after, beforeEach } from "node:test";

const TEST_ADMIN_NAME = "testadmin";
const TEST_ADMIN_PASSWORD = "testpassword";
const TEST_TEAM_ID = 1;
const TEST_TEAM_NAME = "Test Team";
const TEST_EMPLOYEE_ID = 1;
const TEST_EMPLOYEE_NAME = "Test Employee";
const TEST_EMPLOYEE_LINEID = "testlineid";
let adminToken: string;

describe("/api/employees routes", () => {
  before(() => {
    // Ensure tables exist
    initDbStatement();

    // Clean up and insert test admin
    db.prepare(`DELETE FROM Admin WHERE name = ?`).run(TEST_ADMIN_NAME);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO Admin (name, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `).run(TEST_ADMIN_NAME, hashPassword(TEST_ADMIN_PASSWORD), now, now);

    // Clean up and insert test team
    db.prepare(`DELETE FROM Employee`).run();
    db.prepare(`DELETE FROM Team`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='Employee'`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='Team'`).run();
    db.prepare(`
      INSERT INTO Team (teamId, name, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `).run(TEST_TEAM_ID, TEST_TEAM_NAME, now, now);

    // Insert test employee
    db.prepare(`
      INSERT INTO Employee (userId, lineId, name, verified, teamId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(TEST_EMPLOYEE_ID, TEST_EMPLOYEE_LINEID, TEST_EMPLOYEE_NAME, 0, TEST_TEAM_ID, now, now);
  });

  after(() => {
    // Clean up test data
    db.prepare(`DELETE FROM Admin WHERE name = ?`).run(TEST_ADMIN_NAME);
    db.prepare(`DELETE FROM Employee`).run();
    db.prepare(`DELETE FROM Team`).run();
  });

  beforeEach(async () => {
    // Login as admin and store token
    const res = await request(app)
      .post("/api/admin/login")
      .send({ name: TEST_ADMIN_NAME, password: TEST_ADMIN_PASSWORD });
    assert.strictEqual(res.status, 200);
    adminToken = res.body.token;
    assert.ok(adminToken);
  });

  it("GET /api/employees should return a paginated list of employees", async () => {
    const res = await request(app)
      .get("/api/employees")
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
    assert.strictEqual(res.body.data[0].name, TEST_EMPLOYEE_NAME);
    assert.strictEqual(res.body.data[0].teamName, TEST_TEAM_NAME);
  });

  it("GET /api/employees/:userId should return the employee by ID", async () => {
    const res = await request(app)
      .get(`/api/employees/${TEST_EMPLOYEE_ID}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, TEST_EMPLOYEE_ID);
    assert.strictEqual(res.body.name, TEST_EMPLOYEE_NAME);
    assert.strictEqual(res.body.teamId, TEST_TEAM_ID);
  });

  it("PUT /api/employees/:userId/verify should verify the employee", async () => {
    const res = await request(app)
      .put(`/api/employees/${TEST_EMPLOYEE_ID}/verify`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, "Employee verified successfully.");

    // Check that the employee is now verified
    const getRes = await request(app)
      .get(`/api/employees/${TEST_EMPLOYEE_ID}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(getRes.body.verified, 1);
  });

  it("PUT /api/employees/:userId should update the employee", async () => {
    const newName = "Updated Employee";
    const newLineId = "updatedlineid";
    const res = await request(app)
      .put(`/api/employees/${TEST_EMPLOYEE_ID}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: newName, lineId: newLineId, teamId: TEST_TEAM_ID });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, "Employee updated successfully.");

    // Check that the employee was updated
    const getRes = await request(app)
      .get(`/api/employees/${TEST_EMPLOYEE_ID}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(getRes.body.name, newName);
    assert.strictEqual(getRes.body.lineId, newLineId);
  });

  it("DELETE /api/employees/:userId should delete the employee", async () => {
    // First, create a new employee to delete
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO Employee (lineId, name, verified, teamId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run("del-lineid", "Delete Me", 0, TEST_TEAM_ID, now, now);

    // Find the new employee's ID
    const getRes = await request(app)
      .get("/api/employees")
      .set("Authorization", `Bearer ${adminToken}`);
    const employee = getRes.body.data.find((e: any) => e.name === "Delete Me");
    assert.ok(employee);

    // Delete the employee
    const delRes = await request(app)
      .delete(`/api/employees/${employee.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.body.message, "Employee deleted successfully.");
    });
});