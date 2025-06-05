import express, { Request, Response, Router } from 'express';
import db from '../db.js';
import { Admin, JwtPayload } from '../interfaces/internalTypes.js';
import generateAccessToken from '../utils/generateAccessToken.js';
import setTokenAsCookie from '../utils/setTokenAsCookie.js';
import logger from '../logger.js';
const router: Router = express.Router();

router.post('/login', (req: Request, res: Response) => {
  const { name, password } = req.body;

  // Input validation
  if (typeof name !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid name or password.' });
    return;
  }

  try {
    const stmt = db.prepare<[string, string], Admin>('SELECT * FROM Admin WHERE name = ? AND password = ?');
    const admin = stmt.get(name, password);

    if (!admin) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    // Generate JWT token and set it as a cookie
    const token = generateAccessToken(admin);
    setTokenAsCookie(token, req, res);

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    logger.error("Error during admin login:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;


