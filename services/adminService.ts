import db from '../db.js';
import { AdminExternal, mapAdminToExternal } from '../interfaces/externalTypes.js';
import { Admin } from '../interfaces/internalTypes.js';

export function authAdmin(name: string, password: string): AdminExternal | undefined {
  try {
    const stmt = db.prepare<[string, string], Admin>('SELECT * FROM Admin WHERE name = ? AND password = ?');
    const admin = stmt.get(name, password);
    return admin && mapAdminToExternal(admin);
  } catch (error) {
    console.error("Error fetching admin by name:", error);
  }
}