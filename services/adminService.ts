import db from '../db.js';
import { Admin } from '../interfaces/internalTypes.js';

export function getAdminByName(name: string): Admin | null {
  try {
    const stmt = db.prepare<[string], Admin>('SELECT * FROM Admin WHERE name = ?');
    const admin = stmt.get(name);
    return admin || null;
  } catch (error) {
    console.error("Error fetching admin by name:", error);
    return null;
  }
}