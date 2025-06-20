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
const TEST_CAR_ID = 1;
const TEST_CAR_PLATE = "TEST-123";
const TEST_RESERVATION_ID = 1;
const TEST_DESCRIPTION = "Test reservation";
const TEST_CHECKIN_TIME = new Date(Date.UTC(2023, 0, 1, 12, 0, 0, 0)).toISOString();
const TEST_CHECKOUT_TIME = new Date(Date.UTC(2023, 0, 1, 14, 0, 0, 0)).toISOString();

let adminToken: string;

describe("/api/reservations routes", () => {
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
    db.prepare(`DELETE FROM Reservation`).run();
    db.prepare(`DELETE FROM Employee`).run();
    db.prepare(`DELETE FROM Car`).run();
    db.prepare(`DELETE FROM Team`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='Reservation'`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='Employee'`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='Car'`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='Team'`).run();

    db.prepare(`
      INSERT INTO Team (teamId, name, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `).run(TEST_TEAM_ID, TEST_TEAM_NAME, now, now);

    db.prepare(`
      INSERT INTO Employee (userId, lineId, name, verified, teamId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(TEST_EMPLOYEE_ID, TEST_EMPLOYEE_LINEID, TEST_EMPLOYEE_NAME, 1, TEST_TEAM_ID, now, now);

    db.prepare(`
      INSERT INTO Car (carId, plateNumber, teamId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(TEST_CAR_ID, TEST_CAR_PLATE, TEST_TEAM_ID, now, now);

    db.prepare(`
      INSERT INTO Reservation (reservationId, userId, carId, description, checkinTime, checkoutTime)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(TEST_RESERVATION_ID, TEST_EMPLOYEE_ID, TEST_CAR_ID, TEST_DESCRIPTION, TEST_CHECKIN_TIME, TEST_CHECKOUT_TIME);
  });

  after(() => {
    // Clean up test data
    db.prepare(`DELETE FROM Admin WHERE name = ?`).run(TEST_ADMIN_NAME);
    db.prepare(`DELETE FROM Reservation`).run();
    db.prepare(`DELETE FROM Employee`).run();
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

  it("GET /api/reservations should return a paginated list of reservations", async () => {
    const res = await request(app)
      .get("/api/reservations")
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
    assert.strictEqual(res.body.data[0].description, TEST_DESCRIPTION);
  });

  it("GET /api/reservations/:reservationId should return the reservation by ID", async () => {
    const res = await request(app)
      .get(`/api/reservations/${TEST_RESERVATION_ID}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, TEST_RESERVATION_ID);
    assert.strictEqual(res.body.description, TEST_DESCRIPTION);
    assert.strictEqual(res.body.checkinTime, TEST_CHECKIN_TIME);
    assert.strictEqual(res.body.checkoutTime, TEST_CHECKOUT_TIME);
  });

  it("PUT /api/reservations/:reservationId should update checkinTime and checkoutTime", async () => {
    const newCheckin = new Date(Date.UTC(2023, 0, 2, 10, 0, 0, 0)).toISOString();
    const newCheckout = new Date(Date.UTC(2023, 0, 2, 12, 0, 0, 0)).toISOString();
    const res = await request(app)
      .put(`/api/reservations/${TEST_RESERVATION_ID}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ checkinTime: newCheckin, checkoutTime: newCheckout });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, "Reservation updated successfully.");

    // Check that the reservation was updated
    const getRes = await request(app)
      .get(`/api/reservations/${TEST_RESERVATION_ID}`)
      .set("Authorization", `Bearer ${adminToken}`);
    assert.strictEqual(getRes.body.checkinTime, newCheckin);
    assert.strictEqual(getRes.body.checkoutTime, newCheckout);
  });

  it("PUT /api/reservations/:reservationId should return 400 for invalid checkinTime or checkoutTime", async () => {
    const res = await request(app)
      .put(`/api/reservations/${TEST_RESERVATION_ID}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ checkinTime: "not-a-date", checkoutTime: "" });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error);
  });

  it("PUT /api/reservations/:reservationId should return 404 for non-existent reservation", async () => {
    const newCheckin = new Date(Date.UTC(2023, 0, 3, 10, 0, 0, 0)).toISOString();
    const newCheckout = new Date(Date.UTC(2023, 0, 3, 12, 0, 0, 0)).toISOString();
    const res = await request(app)
      .put(`/api/reservations/99999`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ checkinTime: newCheckin, checkoutTime: newCheckout });
    assert.strictEqual(res.status, 404);
    assert.ok(res.body.error);
  });
});