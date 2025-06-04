import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
const router = express.Router();

function generateAccessToken(user) {
  return jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
}

export default (authenticateToken) => {
  // Admin Login
  router.post('/login', (req, res) => {
    const { name, password } = req.body;

    // Input validation
    if (typeof name !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid name or password.' });
    }

    try {
      const stmt = db.prepare('SELECT * FROM Admin WHERE name = ? AND password = ?');
      const admin = stmt.get(name, password);

      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      // Generate JWT token
      const token = generateAccessToken(admin);

      res.status(200).json({ message: 'Login successful', adminId: admin.adminId, token });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Admin auth endpoint
  router.get('/auth', authenticateToken, (req, res) => {
    res.status(200).json({
      message: 'Admin authenticated',
      adminId: req.user.name
    });
  });

  return router;
};