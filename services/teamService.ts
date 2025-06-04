import db from '../db.js';

export function getTeams(pageSize, offset) {
  const stmt = db.prepare('SELECT * FROM Team LIMIT ? OFFSET ?');
  return stmt.all(pageSize, offset);
}

export function getTeamsCount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM Team');
  return stmt.get().count;
}

export function getTeamById(teamId) {
  const stmt = db.prepare('SELECT * FROM Team WHERE teamId = ?');
  return stmt.get(teamId);
}

export function createTeam(name) {
  const stmt = db.prepare('INSERT INTO Team (name) VALUES (?)');
  return stmt.run(name);
}

export function updateTeam(teamId, name) {
  const stmt = db.prepare('UPDATE Team SET name = ? WHERE teamId = ?');
  return stmt.run(name, teamId);
}

export function deleteTeamAndUnassignMembers(teamId) {
  const transaction = db.transaction((teamId) => {
    db.prepare('UPDATE Employee SET teamId = NULL WHERE teamId = ?').run(teamId);
    const stmt = db.prepare('DELETE FROM Team WHERE teamId = ?');
    return stmt.run(teamId);
  });
  return transaction(teamId);
}