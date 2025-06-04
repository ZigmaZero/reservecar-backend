import db from '../db.js';

export default function authorizeAsAdmin(req, res, next) {
  try {
    const stmt = db.prepare('SELECT * FROM Admin WHERE name = ?');
    const admin = stmt.get(req.user.name);

    if (!admin || admin.password !== req.user.password) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    req.admin = admin; 
    next();
  } catch (error) {
    console.error("Error verifying admin:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}