import Database from 'better-sqlite3';
import db from '../db.js';
import { AdminExternal } from '../interfaces/externalTypes.js';
import { Admin } from '../interfaces/internalTypes.js';
import { comparePassword, hashPassword } from '../utils/passwordHash.js';

export function authAdmin(name: string, password: string): AdminExternal | undefined {
  try {
    const stmt = db.prepare<[string], Admin>('SELECT * FROM Admin WHERE name = ?');
    const admin = stmt.get(name);
    if (admin) {
      const match = comparePassword(password, admin.password);
      if (match) {
        return {
          id: admin.adminId,
          name: admin.name,
        };
      }
      else return undefined;
    }
    else return undefined;
  } catch (error) {
    console.error("Error fetching admin by name:", error);
  }
}

export function getAdminById(id: number): AdminExternal | undefined {
  try {
    const stmt = db.prepare<[number], Admin>('SELECT * FROM Admin WHERE adminId = ?');
    const admin = stmt.get(id);
    if (admin) {
      return {
        id: admin.adminId,
        name: admin.name,
      };
    }
    else return undefined;
  }
  catch (error) {
    console.error("Error updating admin", error);
  }
}

export function updateAdmin(id: number, name: string, password: string): Database.RunResult | undefined {
  try {
    const stmt = db.prepare<[string, string, number], Admin>(`UPDATE Admin SET name = ?, password = ? WHERE adminId = ?`);
    return stmt.run(name, hashPassword(password), id);
  }
  catch (error) {
    console.error("Error updating admin", error);
  }
}