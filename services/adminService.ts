import db from '../db.js';
import { AdminExternal } from '../interfaces/externalTypes.js';
import { Admin } from '../interfaces/internalTypes.js';
import { comparePassword } from '../utils/passwordHash.js';

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