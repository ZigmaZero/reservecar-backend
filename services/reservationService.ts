import Database from 'better-sqlite3';
import db from '../db.js';
import { Count } from '../interfaces/internalTypes.js';
import { ReservationExternal } from '../interfaces/externalTypes.js';

export function getReservations(
  pageSize: number, 
  offset: number,
  sortField: "id" | "user" | "car" | "description" | "checkinTime" | "checkoutTime" | undefined,
  sortOrder: "asc" | "desc" | undefined
): ReservationExternal[] {
  // Map sortField to actual SQL column
  let orderBy = "Reservation.reservationId";
  if (sortField === "user") orderBy = "Employee.name";
  else if (sortField === "car") orderBy = "Car.plateNumber";
  else if (sortField === "description") orderBy = "Reservation.description";
  else if (sortField === "checkinTime") orderBy = "Reservation.checkinTime";
  else if (sortField === "checkoutTime") orderBy = "Reservation.checkoutTime";
  // Only allow asc/desc, fallback to ASC
  const order = sortOrder === "desc" ? "DESC" : "ASC";

  const stmt = db.prepare<[number, number], ReservationExternal>(`
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
    ORDER BY ${orderBy} ${order}
    LIMIT ? OFFSET ?
  `);
  return stmt.all(pageSize, offset);
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