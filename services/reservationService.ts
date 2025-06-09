import Database from 'better-sqlite3';
import db from '../db.js';
import { Count, Reservation } from '../interfaces/internalTypes.js';
import { ReservationExternal } from '../interfaces/externalTypes.js';

export function getReservations(pageSize: number, offset: number): ReservationExternal[] {
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
    LIMIT ? OFFSET ?
  `);
  return stmt.all(pageSize, offset);
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