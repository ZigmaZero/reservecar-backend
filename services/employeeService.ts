import db from '../db.js';

export function getEmployees(pageSize, offset) {
  const stmt = db.prepare('SELECT * FROM Employee LIMIT ? OFFSET ?');
  return stmt.all(pageSize, offset);
}

export function getEmployeesCount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM Employee');
  return stmt.get().count;
}

export function getEmployeeById(userId) {
  const stmt = db.prepare('SELECT * FROM Employee WHERE userId = ?');
  return stmt.get(userId);
}

export function verifyEmployee(userId) {
  const stmt = db.prepare('UPDATE Employee SET verified = 1 WHERE userId = ?');
  return stmt.run(userId);
}

export function assignEmployeeToTeam(userId, teamId) {
  const stmt = db.prepare('UPDATE Employee SET teamId = ? WHERE userId = ?');
  return stmt.run(teamId, userId);
}