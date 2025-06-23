import Database from 'better-sqlite3';
import db from '../db.js';
import { Count } from '../interfaces/internalTypes.js';
import { ReservationExternal } from '../interfaces/externalTypes.js';

export function getReservations(
  pageSize: number, 
  offset: number,
  sortField: "id" | "userId" | "user" | "carId" | "car" | "description" | "checkinTime" | "checkoutTime" | undefined,
  sortOrder: "asc" | "desc" | undefined,
  filterField: "id" | "userId" | "user" | "carId" | "car" | "description" | "checkinTime" | "checkoutTime" | undefined,
  filterOp: "=" | "contains" | "onOrBefore" | "onOrAfter" | "isEmpty" | "isNotEmpty" | undefined,
  filterValue: string | undefined
): ReservationExternal[] {
  // Map sortField to actual SQL column
  let orderBy = "Reservation.reservationId";
  if (sortField === "userId") orderBy = "Reservation.userId";
  else if (sortField === "user") orderBy = "Employee.name";
  else if (sortField === "carId") orderBy = "Reservation.carId";
  else if (sortField === "car") orderBy = "Car.plateNumber";
  else if (sortField === "description") orderBy = "Reservation.description";
  else if (sortField === "checkinTime") orderBy = "Reservation.checkinTime";
  else if (sortField === "checkoutTime") orderBy = "Reservation.checkoutTime";
  const order = sortOrder === "desc" ? "DESC" : "ASC";

  // Filtering
  let filterClause = "1=1";
  let params: any[] = [];

  if (filterField && filterOp) {
    // "=" for id, userId, carId
    if (
      (filterField === "id" || filterField === "userId" || filterField === "carId") &&
      filterOp === "=" &&
      filterValue !== undefined &&
      filterValue !== ""
    ) {
      const column =
        filterField === "id"
          ? "Reservation.reservationId"
          : filterField === "userId"
          ? "Reservation.userId"
          : "Reservation.carId";
      filterClause += ` AND ${column} = ?`;
      params.push(Number(filterValue));
    }
    // "contains" for user, car, description
    else if (
      (filterField === "user" || filterField === "car" || filterField === "description") &&
      filterOp === "contains" &&
      filterValue !== undefined &&
      filterValue !== ""
    ) {
      const column =
        filterField === "user"
          ? "Employee.name"
          : filterField === "car"
          ? "Car.plateNumber"
          : "Reservation.description";
      filterClause += ` AND ${column} LIKE ?`;
      params.push(`%${filterValue}%`);
    }
    // checkinTime: onOrBefore/onOrAfter
    else if (
      filterField === "checkinTime" &&
      (filterOp === "onOrBefore" || filterOp === "onOrAfter") &&
      filterValue !== undefined &&
      filterValue !== ""
    ) {
      const column = "Reservation.checkinTime";
      if (filterOp === "onOrBefore") {
        filterClause += ` AND ${column} <= ?`;
      } else {
        filterClause += ` AND ${column} >= ?`;
      }
      params.push(new Date(filterValue).toISOString());
    }
    // checkoutTime: onOrBefore/onOrAfter/isEmpty/isNotEmpty
    else if (filterField === "checkoutTime") {
      const column = "Reservation.checkoutTime";
      if (
        (filterOp === "onOrBefore" || filterOp === "onOrAfter") &&
        filterValue !== undefined &&
        filterValue !== ""
      ) {
        if (filterOp === "onOrBefore") {
          filterClause += ` AND ${column} <= ?`;
        } else {
          filterClause += ` AND ${column} >= ?`;
        }
        params.push(new Date(filterValue).toISOString());
      } else if (filterOp === "isEmpty") {
        filterClause += ` AND ${column} IS NULL`;
      } else if (filterOp === "isNotEmpty") {
        filterClause += ` AND ${column} IS NOT NULL`;
      }
    }
    // If filterValue is undefined or empty, ignore the filter (do not add to clause)
  }

  const stmt = db.prepare<[...any[], number, number], ReservationExternal>(`
    SELECT
      Reservation.reservationId AS id,
      Reservation.userId AS userId,
      Employee.name AS user,
      Reservation.carId AS carId,
      Car.plateNumber AS car,
      Reservation.description AS description,
      Reservation.checkinTime AS checkinTime,
      Reservation.checkoutTime AS checkoutTime
    FROM Reservation
    LEFT JOIN Employee ON Reservation.userId = Employee.userId
    LEFT JOIN Car ON Reservation.carId = Car.carId
    WHERE ${filterClause}
    ORDER BY ${orderBy} ${order}
    LIMIT ? OFFSET ?
  `);
  return stmt.all(...params, pageSize, offset);
}

export function getReservationsBetweenTime(startTime: Date, endTime: Date): ReservationExternal[] {
  const stmt = db.prepare<[string, string], ReservationExternal>(`
    SELECT
      Reservation.reservationId AS id,
      Reservation.userId AS userId,
      Employee.name AS user,
      Reservation.carId AS carId,
      Car.plateNumber AS car,
      Reservation.description AS description,
      Reservation.checkinTime AS checkinTime,
      Reservation.checkoutTime AS checkoutTime
    FROM Reservation
    LEFT JOIN Employee ON Reservation.userId = Employee.userId
    LEFT JOIN Car ON Reservation.carId = Car.carId
    WHERE Reservation.checkinTime >= ? AND Reservation.checkinTime <= ?
  `);
  return stmt.all(startTime.toISOString(), endTime.toISOString());
}

export function getReservationsCount(): number {
  const stmt = db.prepare<[], Count>('SELECT COUNT(*) as count FROM Reservation');
  const count = stmt.get();
  return count ? count.count : 0;
}

export function createReservation(userId: number, carId: number, description: string, checkinTime: string): Database.RunResult {
  const stmt = db.prepare('INSERT INTO Reservation (userId, carId, description, checkinTime) VALUES (?, ?, ?, ?)');
  return stmt.run(userId, carId, description, checkinTime);
}

export function getReservationById(reservationId: number): ReservationExternal | undefined {
  const stmt = db.prepare<[number], ReservationExternal>(`
    SELECT
      Reservation.reservationId AS id,
      Reservation.userId AS userId,
      Employee.name AS user,
      Reservation.carId AS carId,
      Car.plateNumber AS car,
      Reservation.description AS description,
      Reservation.checkinTime AS checkinTime,
      Reservation.checkoutTime AS checkoutTime
    FROM Reservation
    LEFT JOIN Employee ON Reservation.userId = Employee.userId
    LEFT JOIN Car ON Reservation.carId = Car.carId
    WHERE Reservation.reservationId = ?
  `);
  return stmt.get(reservationId);
}

export function getReservationByUser(userId: number): ReservationExternal[] {
  const stmt = db.prepare<[number], ReservationExternal>(`
    SELECT
      Reservation.reservationId AS id,
      Reservation.userId AS userId,
      Employee.name AS user,
      Reservation.carId AS carId,
      Car.plateNumber AS car,
      Reservation.description AS description,
      Reservation.checkinTime AS checkinTime,
      Reservation.checkoutTime AS checkoutTime
    FROM Reservation
    LEFT JOIN Employee ON Reservation.userId = Employee.userId
    LEFT JOIN Car ON Reservation.carId = Car.carId
    WHERE Reservation.userId = ?
    AND Reservation.checkoutTime IS NULL
    ORDER BY Reservation.reservationId DESC
  `);
  return stmt.all(userId);
}

export function checkoutReservation(reservationId: number, checkoutTime: string): Database.RunResult {
  const stmt = db.prepare('UPDATE Reservation SET checkoutTime = ? WHERE reservationId = ?');
  return stmt.run(checkoutTime, reservationId);
}

export function updateReservation(
  reservationId: number,
  checkinTime: string,
  checkoutTime: string
): Database.RunResult {
  const stmt = db.prepare(
    `UPDATE Reservation
     SET checkinTime = ?,
         checkoutTime = ?
     WHERE reservationId = ?`
  );
  return stmt.run(checkinTime, checkoutTime, reservationId);
}