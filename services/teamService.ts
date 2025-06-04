import Database from 'better-sqlite3';
import db from '../db.js';
import { Count, Team } from '../interfaces/dbTypes.js';

export function getTeams(pageSize: number, offset: number): Team[] {
  const stmt = db.prepare<[number, number], Team>('SELECT * FROM Team LIMIT ? OFFSET ?');
  return stmt.all(pageSize, offset);
}

export function getTeamsCount(): number {
  const stmt = db.prepare<[], Count>('SELECT COUNT(*) as count FROM Team');
  const count = stmt.get();
  return count ? count.count : 0;
}

export function getTeamById(teamId: number): Team | undefined {
  const stmt = db.prepare<number, Team>('SELECT * FROM Team WHERE teamId = ?');
  return stmt.get(teamId);
}

export function createTeam(name: string): Database.RunResult {
  const stmt = db.prepare('INSERT INTO Team (name) VALUES (?)');
  return stmt.run(name);
}

export function updateTeam(teamId: number, name: string): Database.RunResult {
  const stmt = db.prepare('UPDATE Team SET name = ? WHERE teamId = ?');
  return stmt.run(name, teamId);
}

export function deleteTeamAndUnassignMembers(teamId: number): Database.RunResult {
  const transaction = db.transaction((teamId: number) => {
    db.prepare('UPDATE Employee SET teamId = NULL WHERE teamId = ?').run(teamId);
    const stmt = db.prepare('DELETE FROM Team WHERE teamId = ?');
    return stmt.run(teamId);
  });
  return transaction(teamId);
}