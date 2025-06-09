import Database from 'better-sqlite3';
import db from '../db.js';
import { Count, Reservation } from '../interfaces/internalTypes.js';

export function getReservations(pageSize: number, offset: number): Reservation[] {
  const stmt = db.prepare<[number, number], Reservation>('SELECT * FROM Reservation LIMIT ? OFFSET ?');
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

export function getReservationById(reservationId: number): Reservation | undefined {
  const stmt = db.prepare<[number], Reservation>('SELECT * FROM Reservation WHERE reservationId = ?')
  return stmt.get(reservationId);
}

export function getReservationByUser(userId: number): Reservation[] {
  const stmt = db.prepare<[number], Reservation>('SELECT * FROM Reservation WHERE userId = ? AND checkoutTime IS NULL');
  return stmt.all(userId);
}

export function checkoutReservation(reservationId: number, checkoutTime: string): Database.RunResult {
  const stmt = db.prepare('UPDATE Reservation SET checkoutTime = ? WHERE reservationId = ?');
  return stmt.run(checkoutTime, reservationId);
}