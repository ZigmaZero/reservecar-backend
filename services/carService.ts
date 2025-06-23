import db from '../db.js';
import { Car, Count } from '../interfaces/internalTypes.js';
import { CarExternal } from '../interfaces/externalTypes.js';
import Database from 'better-sqlite3';

export function getCars(
  pageSize: number, 
  offset: number, 
  sortField: "id" | "plateNumber" | "teamId" | "teamName" | undefined, 
  sortOrder: "asc" | "desc" | null | undefined,
  filterField: "id" | "plateNumber" | "teamId" | "teamName" | undefined,
  filterOp: "=" | "contains" | undefined,
  filterValue: string | undefined
): CarExternal[] {
  // Default sort
  let orderBy = "Car.carId";
  if (sortField === "plateNumber") orderBy = "Car.plateNumber";
  else if (sortField === "teamId") orderBy = "Car.teamId";
  else if (sortField === "teamName") orderBy = "Team.name";
  const order = sortOrder === "desc" ? "DESC" : "ASC";

  // Filtering
  let filterClause = "Car.deletedAt IS NULL";
  let params: any[] = [];

  if (filterField && filterValue !== undefined && filterValue !== "") {
    if (filterField === "id" && filterOp === "=") {
      filterClause += " AND Car.carId = ?";
      params.push(Number(filterValue));
    } else if (filterField === "teamId" && filterOp === "=") {
      filterClause += " AND Car.teamId = ?";
      params.push(Number(filterValue));
    } else if (filterField === "plateNumber" && filterOp === "contains") {
      filterClause += " AND Car.plateNumber LIKE ?";
      params.push(`%${filterValue}%`);
    } else if (filterField === "teamName" && filterOp === "contains") {
      filterClause += " AND Team.name LIKE ?";
      params.push(`%${filterValue}%`);
    }
  }

  const stmt = db.prepare<[...any[], number, number], CarExternal>(`
    SELECT 
      Car.carId AS id,
      Car.plateNumber,
      Car.teamId,
      Team.name AS teamName
    FROM Car
    LEFT JOIN Team ON Car.teamId = Team.teamId
    WHERE ${filterClause}
    ORDER BY ${orderBy} ${order}
    LIMIT ? OFFSET ?
  `);

  return stmt.all(...params, pageSize, offset);
}

export function getCarsCount(): number {
  const stmt = db.prepare<[], Count>('SELECT COUNT(*) as count FROM Car WHERE deletedAt IS NULL');
  const count = stmt.get();
  return count ? count.count : 0;
}

export function getCarsByTeam(teamId: number): CarExternal[] {
  const stmt = db.prepare<[number], CarExternal>(`
    SELECT 
      Car.carId AS id,
      Car.plateNumber,
      Car.teamId,
      Team.name AS teamName
    FROM Car
    LEFT JOIN Team ON Car.teamId = Team.teamId
    WHERE Car.teamId = ? AND Car.deletedAt IS NULL
  `);
  return stmt.all(teamId);
}

export function getCarById(carId: number): CarExternal | undefined {
  const stmt = db.prepare<[number], CarExternal>(`
    SELECT 
      Car.carId AS id,
      Car.plateNumber,
      Car.teamId,
      Team.name AS teamName
    FROM Car
    LEFT JOIN Team ON Car.teamId = Team.teamId
    WHERE Car.carId = ? AND Car.deletedAt IS NULL
  `);
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