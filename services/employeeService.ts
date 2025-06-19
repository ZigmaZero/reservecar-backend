import Database from 'better-sqlite3';
import db from '../db.js';
import { Count, Employee } from '../interfaces/internalTypes.js';
import { EmployeeExternal } from '../interfaces/externalTypes.js';

export function getEmployees(
  pageSize: number, 
  offset: number, 
  sortField: "id" | "teamName" | "verified" | "name" | undefined,
  sortOrder: "asc" | "desc" | undefined
): EmployeeExternal[] {
  // Determine the ORDER BY field
  let orderBy = "Employee.userId";
  if (sortField === "teamName") orderBy = "Team.name";
  else if (sortField === "verified") orderBy = "Employee.verified";
  else if (sortField === "name") orderBy = "Employee.name";
  // Only allow asc/desc, fallback to ASC
  const order = sortOrder === "desc" ? "DESC" : "ASC";

  const stmt = db.prepare<[number, number], EmployeeExternal>(`
    SELECT 
      Employee.userId AS id,
      Employee.lineId,
      Employee.name,
      Employee.verified,
      Employee.teamId,
      Team.name AS teamName
    FROM Employee
    LEFT JOIN Team ON Employee.teamId = Team.teamId
    WHERE Employee.deletedAt IS NULL
    ORDER BY ${orderBy} ${order}
    LIMIT ? OFFSET ?
  `);
  return stmt.all(pageSize, offset);
}

export function getEmployeesCount(): number {
  const stmt = db.prepare<[], Count>('SELECT COUNT(*) as count FROM Employee WHERE deletedAt IS NULL');
  const count = stmt.get();
  return count ? count.count : 0;
}

// Get employee by id with teamName
export function getEmployeeById(userId: number): EmployeeExternal | undefined {
  const stmt = db.prepare<[number], EmployeeExternal>(`
    SELECT 
      Employee.userId AS id,
      Employee.lineId,
      Employee.name,
      Employee.verified,
      Employee.teamId,
      Team.name AS teamName
    FROM Employee
    LEFT JOIN Team ON Employee.teamId = Team.teamId
    WHERE Employee.userId = ? AND Employee.deletedAt IS NULL
  `);
  return stmt.get(userId);
}

// Get employee by name with teamName
export function getEmployeeByLineId(lineId: string): EmployeeExternal | undefined {
  const stmt = db.prepare<[string], EmployeeExternal>(`
    SELECT 
      Employee.userId AS id,
      Employee.lineId,
      Employee.name,
      Employee.verified,
      Employee.teamId,
      Team.name AS teamName
    FROM Employee
    LEFT JOIN Team ON Employee.teamId = Team.teamId
    WHERE Employee.lineId = ? AND Employee.deletedAt IS NULL
  `);
  return stmt.get(lineId);
}

export function createEmployee(fullName: string, lineId: string): Database.RunResult {
  const stmt = db.prepare<[string, string, number, string, string], Employee>('INSERT INTO Employee (name, lineId, verified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)');
  return stmt.run(fullName, lineId, 0, new Date().toISOString(), new Date().toISOString());
}

export function verifyEmployee(userId: number): Database.RunResult {
  const stmt = db.prepare('UPDATE Employee SET verified = 1 WHERE userId = ? AND deletedAt IS NULL');
  return stmt.run(userId);
}

export function updateEmployee(userId: number, name: string, lineId?: string, teamId?: number): Database.RunResult {
  const stmt = db.prepare<[string, string | undefined, number | undefined, string, number], Employee>(
    'UPDATE Employee SET name = ?, lineId = ?, teamId = ?, updatedAt = ? WHERE userId = ? AND deletedAt IS NULL'
  );
  return stmt.run(name, lineId, teamId, new Date().toISOString(), userId);
}

export function removeEmployee(userId: number): Database.RunResult {
  const stmt = db.prepare<[string, number], Employee>('UPDATE Employee SET deletedAt = ? WHERE userId = ?');
  return stmt.run(new Date().toISOString(), userId);
}