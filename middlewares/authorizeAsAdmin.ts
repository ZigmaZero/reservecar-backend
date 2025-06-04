import { NextFunction, Response } from 'express';
import db from '../db.js';
import AuthenticatedRequest from '../interfaces/authenticatedRequest.js';
import { Admin } from '../interfaces/dbTypes.js';

export default function authorizeAsAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const stmt = db.prepare<Admin[], Admin>('SELECT * FROM Admin WHERE name = ?');
    const admin = stmt.get(req.payload.name);

    if (!admin || admin.password !== req.payload.password) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Error verifying admin:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}