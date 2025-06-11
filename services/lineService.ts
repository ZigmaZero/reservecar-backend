import Database from 'better-sqlite3';
import db from '../db.js';

export function storeState(state: string): Database.RunResult {
    const currTime = new Date().toISOString();
    const stmt = db.prepare<[string, string], {state: string, createdAt: string}>(`INSERT INTO LineLoginState (state, createdAt) VALUES (?, ?)`);
    return stmt.run(state, currTime);
}

export function getState(state: string): {state: string, createdAt: string} | undefined {
    const stmt = db.prepare<string, {state: string, createdAt: string}>(`SELECT * FROM LineLoginState WHERE state = ?`);
    return stmt.get(state);
}

export function removeState(state: string): Database.RunResult {
    const stmt = db.prepare<string>(`DELETE FROM LineLoginState WHERE state = ?`);
    return stmt.run(state);
}