import Database from 'better-sqlite3';
import db from '../db.js';
import { Count, Employee } from '../interfaces/internalTypes.js';
import { EmployeeExternal, mapEmployeeToExternal } from '../interfaces/externalTypes.js';

export function getEmployees(pageSize: number, offset: number): EmployeeExternal[] {
  const stmt = db.prepare<[number, number], Employee>('SELECT * FROM Employee WHERE deletedAt IS NULL LIMIT ? OFFSET ?');
  return stmt.all(pageSize, offset).map(employee => mapEmployeeToExternal(employee));
}

export function getEmployeesCount(): number {
  const stmt = db.prepare<[], Count>('SELECT COUNT(*) as count FROM Employee WHERE deletedAt IS NULL');
  const count = stmt.get();
  return count ? count.count : 0;
}

export function getEmployeeById(userId: number): EmployeeExternal | undefined {
  const stmt = db.prepare<[number], Employee>('SELECT * FROM Employee WHERE userId = ? AND deletedAt IS NULL');
  const employee = stmt.get(userId);
  return employee && mapEmployeeToExternal(employee);
}

export function getEmployeeByName(fullName: string): EmployeeExternal | undefined {
  const stmt = db.prepare<[string], Employee>('SELECT * FROM Employee WHERE name = ? AND deletedAt IS NULL');
  const employee = stmt.get(fullName);
  return employee && mapEmployeeToExternal(employee);
}

export function createEmployee(fullName: string): Database.RunResult {
  const stmt = db.prepare<[string, number, string, string], Employee>('INSERT INTO Employee (name, verified, createdAt, updatedAt) VALUES (?, ?, ?, ?)');
  return stmt.run(fullName, 0, new Date().toISOString(), new Date().toISOString());
}

export function verifyEmployee(userId: number): Database.RunResult {
  const stmt = db.prepare('UPDATE Employee SET verified = 1 WHERE userId = ?');
  return stmt.run(userId);
}

export function updateEmployee(userId: number, name: string, lineId?: string, teamId?: number): Database.RunResult {
  const stmt = db.prepare<[string, string | undefined, number | undefined, string, number], Employee>(
    'UPDATE Employee SET name = ?, lineId = ?, teamId = ?, updatedAt = ? WHERE userId = ?'
  );
  return stmt.run(name, lineId, teamId, new Date().toISOString(), userId);
}

export function removeEmployee(userId: number): Database.RunResult {
  const stmt = db.prepare<[string, number], Employee>('UPDATE Employee SET deletedAt = ? WHERE userId = ?');
  return stmt.run(new Date().toISOString(), userId);
}