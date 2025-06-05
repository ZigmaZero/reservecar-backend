import { NextFunction, Response } from 'express';
import db from '../db.js';
import AuthenticatedRequest from '../interfaces/authenticatedRequest.js';
import { Employee } from '../interfaces/internalTypes.js';

export default function authorizeAsEmployee(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.payload) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const stmt = db.prepare<[string], Employee>('SELECT * FROM Employee WHERE name = ?');
    const user = stmt.get(req.payload);

    if (!user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    req.employee = user;
    next();
  } catch (error) {
    console.error("Error verifying employee:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}