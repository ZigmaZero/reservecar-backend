import Database from 'better-sqlite3';
import db from '../db.js';
import { Count, Employee } from '../interfaces/dbTypes.js';

export function getEmployees(pageSize: number, offset: number): Employee[] {
  const stmt = db.prepare<[number, number], Employee>('SELECT * FROM Employee LIMIT ? OFFSET ?');
  return stmt.all(pageSize, offset);
}

export function getEmployeesCount(): number {
  const stmt = db.prepare<[], Count>('SELECT COUNT(*) as count FROM Employee');
  const count = stmt.get();
  return count ? count.count : 0;
}

export function getEmployeeById(userId: number): Employee | undefined {
  const stmt = db.prepare<[number], Employee>('SELECT * FROM Employee WHERE userId = ?');
  return stmt.get(userId);
}

export function verifyEmployee(userId: number): Database.RunResult {
  const stmt = db.prepare('UPDATE Employee SET verified = 1 WHERE userId = ?');
  return stmt.run(userId);
}

export function assignEmployeeToTeam(userId: number, teamId: number): Database.RunResult {
  const stmt = db.prepare('UPDATE Employee SET teamId = ? WHERE userId = ?');
  return stmt.run(teamId, userId);
}