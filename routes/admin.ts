import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import authenticateToken from '../middlewares/authenticateToken.js';
import { Admin, JwtPayload } from '../interfaces/dbTypes.js';
const router: Router = express.Router();

function generateAccessToken(user: Admin): string {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) {
    throw new Error('TOKEN_SECRET is not set in environment variables.');
  }

  return jwt.sign({name: user.name} as JwtPayload, secret, { expiresIn: '1800s' });
}

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

    // Generate JWT token
    const token = generateAccessToken(admin);
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    res.cookie('admin_token', token, {
        path: '/',
        maxAge: 1800 * 1000, // 30 minutes
        httpOnly: true, // Always secure from JavaScript
        sameSite: 'strict',
        secure: isSecure // Set 'secure' flag only if HTTPS is detected
    });

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;