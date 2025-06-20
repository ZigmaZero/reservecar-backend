import assert from "assert";
import request from "supertest";
import app from "../app.js";
import db from "../db.js";
import { initDbStatement } from "../utils/initiateDatabase.js";
import { hashPassword } from "../utils/passwordHash.js";
import { describe, it, before, beforeEach, after } from "node:test";

const TEST_ADMIN_NAME = "testadmin";
const TEST_ADMIN_PASSWORD = "testpassword";
const TEST_TEAM_ID = 1;
const TEST_TEAM_NAME = "Test Team";
const TEST_CAR_ID = 1;
const TEST_CAR_PLATE = "TEST-123";

let adminToken: string;

describe("/api/cars routes", () => {
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
    db.prepare(`DELETE FROM Team WHERE name = ?`).run(TEST_TEAM_NAME);
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='Team'`).run();
    db.prepare(`
      INSERT INTO Team (teamId, name, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `).run(TEST_TEAM_ID, TEST_TEAM_NAME, now, now);

    // Clean up and insert test car
    db.prepare(`DELETE FROM Car`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='Car'`).run();
    db.prepare(`
      INSERT INTO Car (carId, plateNumber, teamId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(TEST_CAR_ID, TEST_CAR_PLATE, TEST_TEAM_ID, now, now);
  });

  after(() => {
    // Clean up test data
    db.prepare(`DELETE FROM Admin WHERE name = ?`).run(TEST_ADMIN_NAME);
    db.prepare(`DELETE FROM Car`).run();
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

  it("GET /api/cars should return a paginated list of cars", async () => {
    const res = await request(app)
      .get("/api/cars")
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
    assert.strictEqual(res.body.data[0].plateNumber, TEST_CAR_PLATE);
    assert.strictEqual(res.body.data[0].teamName, TEST_TEAM_NAME);
  });

  it("GET /api/cars/:carId should return the car by ID", async () => {
    const res = await request(app)
      .get(`/api/cars/${TEST_CAR_ID}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, TEST_CAR_ID);
    assert.strictEqual(res.body.plateNumber, TEST_CAR_PLATE);
    assert.strictEqual(res.body.teamId, TEST_TEAM_ID);
  });

  it("POST /api/cars should create a new car", async () => {
    const res = await request(app)
      .post("/api/cars")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ plateNumber: "NEW-456", teamId: TEST_TEAM_ID });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.success);

    // Check that the car was created
    const getRes = await request(app)
      .get("/api/cars")
      .set("Authorization", `Bearer ${adminToken}`);
    assert.ok(getRes.body.data.some((car: any) => car.plateNumber === "NEW-456"));
  });

  it("PUT /api/cars/:carId should update a car", async () => {
    const res = await request(app)
      .put(`/api/cars/${TEST_CAR_ID}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ plateNumber: "UPDATED-789", teamId: TEST_TEAM_ID });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, "Car updated successfully.");

    // Check that the car was updated
    const getRes = await request(app)
      .get(`/api/cars/${TEST_CAR_ID}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(getRes.body.plateNumber, "UPDATED-789");
  });

  it("DELETE /api/cars/:carId should delete a car", async () => {
    // First, create a car to delete
    const createRes = await request(app)
      .post("/api/cars")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ plateNumber: "DEL-999", teamId: TEST_TEAM_ID });
    assert.strictEqual(createRes.status, 201);

    // Find the new car's ID
    const getRes = await request(app)
      .get("/api/cars")
      .set("Authorization", `Bearer ${adminToken}`);
    const car = getRes.body.data.find((c: any) => c.plateNumber === "DEL-999");
    assert.ok(car);

    // Delete the car
    const delRes = await request(app)
      .delete(`/api/cars/${car.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.body.message, "Car deleted successfully.");
  });
});