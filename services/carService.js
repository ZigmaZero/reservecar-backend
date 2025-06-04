import db from '../db.js';

export function getCars(pageSize, offset) {
  const stmt = db.prepare('SELECT * FROM Car LIMIT ? OFFSET ?');
  return stmt.all(pageSize, offset);
}

export function getCarsCount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM Car');
  return stmt.get().count;
}

export function getCarById(carId) {
  const stmt = db.prepare('SELECT * FROM Car WHERE carId = ?');
  return stmt.get(carId);
}

export function createCar(plateNumber, teamId) {
  const stmt = db.prepare('INSERT INTO Car (plateNumber, teamId) VALUES (?, ?)');
  return stmt.run(plateNumber, teamId);
}

export function updateCar(carId, plateNumber, teamId) {
  const stmt = db.prepare('UPDATE Car SET plateNumber = ?, teamId = ? WHERE carId = ?');
  return stmt.run(plateNumber, teamId, carId);
}

export function deleteCar(carId) {
  const stmt = db.prepare('DELETE FROM Car WHERE carId = ?');
  return stmt.run(carId);
}