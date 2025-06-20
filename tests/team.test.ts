import assert from "assert";
import request from "supertest";
import app from "../app.js";
import db from "../db.js";
import { initDbStatement } from "../services/db_init.js";
import { hashPassword } from "../utils/passwordHash.js";
import { describe, it, before, beforeEach, after } from "node:test";

const TEST_ADMIN_NAME = "testadmin";
const TEST_ADMIN_PASSWORD = "testpassword";
const TEST_TEAM_ID = 1;
const TEST_TEAM_NAME = "Test Team";
const TEST_TEAM_NAME_UPDATED = "Updated Team";
let adminToken: string;

describe("/api/teams routes", () => {
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
    db.prepare(`DELETE FROM Team`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='Team'`).run();
    db.prepare(`
      INSERT INTO Team (teamId, name, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `).run(TEST_TEAM_ID, TEST_TEAM_NAME, now, now);
  });

  after(() => {
    // Clean up test data
    db.prepare(`DELETE FROM Admin WHERE name = ?`).run(TEST_ADMIN_NAME);
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

  it("GET /api/teams should return a paginated list of teams", async () => {
    const res = await request(app)
      .get("/api/teams")
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
    assert.strictEqual(res.body.data[0].name, TEST_TEAM_NAME);
  });

  it("GET /api/teams/all should return all teams", async () => {
    const res = await request(app)
      .get("/api/teams/all")
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.teams));
    assert.ok(res.body.teams.some((team: any) => team.name === TEST_TEAM_NAME));
  });

  it("GET /api/teams/:teamId should return the team by ID", async () => {
    const res = await request(app)
      .get(`/api/teams/${TEST_TEAM_ID}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, TEST_TEAM_ID);
    assert.strictEqual(res.body.name, TEST_TEAM_NAME);
  });

  it("POST /api/teams should create a new team", async () => {
    const res = await request(app)
      .post("/api/teams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "New Team" });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.success);

    // Check that the team was created
    const getRes = await request(app)
      .get("/api/teams/all")
      .set("Authorization", `Bearer ${adminToken}`);
    assert.ok(getRes.body.teams.some((team: any) => team.name === "New Team"));
  });

  it("PUT /api/teams/:teamId should update a team", async () => {
    const res = await request(app)
      .put(`/api/teams/${TEST_TEAM_ID}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: TEST_TEAM_NAME_UPDATED });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, "Team updated successfully.");

    // Check that the team was updated
    const getRes = await request(app)
      .get(`/api/teams/${TEST_TEAM_ID}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(getRes.body.name, TEST_TEAM_NAME_UPDATED);
  });

  it("DELETE /api/teams/:teamId should delete a team", async () => {
    // First, create a team to delete
    const createRes = await request(app)
      .post("/api/teams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Delete Me" });
    assert.strictEqual(createRes.status, 201);

    // Find the new team's ID
    const getRes = await request(app)
      .get("/api/teams/all")
      .set("Authorization", `Bearer ${adminToken}`);
    const team = getRes.body.teams.find((t: any) => t.name === "Delete Me");
    assert.ok(team);

    // Delete the team
    const delRes = await request(app)
      .delete(`/api/teams/${team.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.body.message, "Team deleted successfully. All members have been unassigned.");
  });
});