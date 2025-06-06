import db from '../db.js';
import { Car, Count } from '../interfaces/internalTypes.js';
import Database from 'better-sqlite3';

export function getCars(pageSize: number, offset: number): Car[] {
  const stmt = db.prepare<[number, number], Car>('SELECT * FROM Car WHERE deletedAt IS NULL LIMIT ? OFFSET ?');
  return stmt.all(pageSize, offset);
}

export function getCarsCount(): number {
  const stmt = db.prepare<[], Count>('SELECT COUNT(*) as count FROM Car WHERE deletedAt IS NULL');
  const count = stmt.get();
  return count ? count.count : 0;
}

export function getCarById(carId: number): Car | undefined {
  const stmt = db.prepare<[number], Car>('SELECT * FROM Car WHERE carId = ? AND deletedAt IS NULL');
  return stmt.get(carId);
}

export function createCar(plateNumber: string, teamId: number): Database.RunResult {
  const stmt = db.prepare<[string, number, string, string], Car>('INSERT INTO Car (plateNumber, teamId, createdAt, updatedAt) VALUES (?, ?, ?, ?)');
  return stmt.run(plateNumber, teamId, new Date().toISOString(), new Date().toISOString())
}

export function updateCar(carId: number, plateNumber: string, teamId: number): Database.RunResult {
  const stmt = db.prepare<[string, number, string, number], Car>('UPDATE Car SET plateNumber = ?, teamId = ?, updatedAt = ? WHERE carId = ? AND deletedAt IS NULL');
  return stmt.run(plateNumber, teamId, new Date().toISOString(), carId);
}

export function deleteCar(carId: number, deletedAt: string): Database.RunResult {
  const stmt = db.prepare<[string, number], Car>('UPDATE Car SET deletedAt = ? WHERE carId = ? AND deletedAt IS NULL');
  return stmt.run(deletedAt, carId);
}