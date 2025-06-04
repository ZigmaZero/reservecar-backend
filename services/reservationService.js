import db from '../db.js';

export function getReservations(pageSize, offset) {
  const stmt = db.prepare('SELECT * FROM Reservation LIMIT ? OFFSET ?');
  return stmt.all(pageSize, offset);
}

export function getReservationsCount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM Reservation');
  return stmt.get().count;
}

export function createReservation(userId, carId, checkinTime) {
  const stmt = db.prepare('INSERT INTO Reservation (userId, carId, checkinTime) VALUES (?, ?, ?)');
  return stmt.run(userId, carId, checkinTime);
}

export function getReservationById(reservationId) {
  return db.prepare('SELECT * FROM Reservation WHERE reservationId = ?').get(reservationId);
}

export function checkoutReservation(reservationId, checkoutTime) {
  const stmt = db.prepare('UPDATE Reservation SET checkoutTime = ? WHERE reservationId = ?');
  return stmt.run(checkoutTime, reservationId);
}