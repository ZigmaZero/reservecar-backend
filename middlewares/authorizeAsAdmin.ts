import { NextFunction, Response } from 'express';
import db from '../db.js';
import AuthenticatedRequest from '../interfaces/authenticatedRequest.js';
import { Admin } from '../interfaces/internalTypes.js';

export default function authorizeAsAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.payload) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!req.payload.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const stmt = db.prepare<[number], Admin>('SELECT * FROM Admin WHERE adminId = ?');
    const admin = stmt.get(req.payload.id);

    if (!admin) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Error verifying admin:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}