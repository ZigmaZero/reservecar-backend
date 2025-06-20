import assert from "assert";
import request from "supertest";
import app from "../app.js";
import db from "../db.js";
import { initDbStatement } from "../services/db_init.js";
import { hashPassword } from "../utils/passwordHash.js";
import { describe, it, before, after, beforeEach } from "node:test";

const TEST_ADMIN_NAME = "testadmin";
const TEST_ADMIN_PASSWORD = "testpassword";
const TEST_TEAM_ID = 1;
const TEST_TEAM_NAME = "Test Team";
const TEST_EMPLOYEE_NAME = "Test Employee";
const TEST_EMPLOYEE_LINEID = "testlineid";
const TEST_CAR_ID = 1;
const TEST_CAR_PLATE = "TEST-123";
const TEST_DESCRIPTION = "Test reservation";

let adminToken: string;
let userToken: string;
let userId: number;

describe("/api/user routes", () => {
  before(() => {
    // Ensure tables exist
    initDbStatement();

    // Clean up all tables
    db.prepare(`DELETE FROM Reservation`).run();
    db.prepare(`DELETE FROM Employee`).run();
    db.prepare(`DELETE FROM Car`).run();
    db.prepare(`DELETE FROM Team`).run();
    db.prepare(`DELETE FROM Admin WHERE name = ?`).run(TEST_ADMIN_NAME);
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='Reservation'`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='Employee'`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='Car'`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='Team'`).run();

    // Insert test admin
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO Admin (name, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `).run(TEST_ADMIN_NAME, hashPassword(TEST_ADMIN_PASSWORD), now, now);

    // Insert test team
    db.prepare(`
      INSERT INTO Team (teamId, name, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `).run(TEST_TEAM_ID, TEST_TEAM_NAME, now, now);

    // Insert test car
    db.prepare(`
      INSERT INTO Car (carId, plateNumber, teamId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(TEST_CAR_ID, TEST_CAR_PLATE, TEST_TEAM_ID, now, now);
  });

  after(() => {
    // Clean up all tables
    db.prepare(`DELETE FROM Reservation`).run();
    db.prepare(`DELETE FROM Employee`).run();
    db.prepare(`DELETE FROM Car`).run();
    db.prepare(`DELETE FROM Team`).run();
    db.prepare(`DELETE FROM Admin WHERE name = ?`).run(TEST_ADMIN_NAME);
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

  it("should register, login, checkin, and checkout for a user", async () => {
    // Register user
    let res = await request(app)
      .post("/api/user/register")
      .send({ fullName: TEST_EMPLOYEE_NAME, lineId: TEST_EMPLOYEE_LINEID });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.success);

    // Confirm user exists in Employee table
    const empRes = await request(app)
      .get("/api/employees")
      .set("Authorization", `Bearer ${adminToken}`);
    const employee = empRes.body.data.find((e: any) => e.lineId === TEST_EMPLOYEE_LINEID);
    assert.ok(employee);
    userId = employee.id;

    // Verify the user
    let verifyRes = await request(app)
    .put(`/api/employees/${userId}/verify`)
    .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(verifyRes.status, 200);

    // Assign the user to the test team
    let updateRes = await request(app)
    .put(`/api/employees/${userId}`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: TEST_EMPLOYEE_NAME, lineId: TEST_EMPLOYEE_LINEID, teamId: TEST_TEAM_ID });
    assert.strictEqual(updateRes.status, 200);

    // Login user
    res = await request(app)
      .post("/api/user/login")
      .send({ lineId: TEST_EMPLOYEE_LINEID });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
    userToken = res.body.token;

    // User checkin
    res = await request(app)
      .post("/api/user/checkin")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ carId: TEST_CAR_ID, description: TEST_DESCRIPTION });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.success);

    // Confirm reservation exists in /api/reservations
    const reservationsRes = await request(app)
      .get("/api/reservations")
      .set("Authorization", `Bearer ${adminToken}`);
    const reservation = reservationsRes.body.data.find((r: any) => r.userId === userId && r.carId === TEST_CAR_ID);
    assert.ok(reservation);

    // User checkout
    res = await request(app)
      .post("/api/user/checkout")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ reservationId: reservation.id });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, "Checkout successful.");

    // Confirm reservation is checked out
    const reservationDetail = await request(app)
      .get(`/api/reservations/${reservation.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.ok(reservationDetail.body.checkoutTime);
  });

  it("should allow user to fetch their cars and reservations", async () => {
  // Login user
  let res = await request(app)
    .post("/api/user/login")
    .send({ lineId: TEST_EMPLOYEE_LINEID });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.token);
  userToken = res.body.token;

  // User fetch cars (should return cars for their team)
  res = await request(app)
    .get("/api/user/cars")
    .set("Authorization", `Bearer ${userToken}`);
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.cars));
  assert.ok(res.body.cars.some((c: any) => c.id === TEST_CAR_ID));

  // User fetch reservations (should return none before checkin)
  res = await request(app)
    .get("/api/user/reservations")
    .set("Authorization", `Bearer ${userToken}`);
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.reservations));
  assert.ok(!res.body.reservations.some((r: any) => r.carId === TEST_CAR_ID));

  // User checkin
  res = await request(app)
    .post("/api/user/checkin")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ carId: TEST_CAR_ID, description: TEST_DESCRIPTION });
  assert.strictEqual(res.status, 201);
  assert.ok(res.body.success);

  // User fetch reservations (should now include the new reservation)
  res = await request(app)
    .get("/api/user/reservations")
    .set("Authorization", `Bearer ${userToken}`);
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.reservations));
  assert.ok(res.body.reservations.some((r: any) => r.carId === TEST_CAR_ID));
  });

  it("should fail registration with invalid data", async () => {
    let res = await request(app)
      .post("/api/user/register")
      .send({ fullName: "", lineId: "" });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error);
  });

  it("should fail login with invalid lineId", async () => {
    let res = await request(app)
      .post("/api/user/login")
      .send({ lineId: "" });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error);

    res = await request(app)
      .post("/api/user/login")
      .send({ lineId: "nonexistent" });
    assert.strictEqual(res.status, 404);
    assert.ok(res.body.error);
  });
});