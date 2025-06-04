import express from 'express';
import db from '../db.js';
const router = express.Router();

export default (authenticateToken) => {
  // Get all reservations with pagination
  // GET /reservations?page=1&pageSize=10
  router.get('/', authenticateToken, (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    if (page < 1 || pageSize < 1) {
      return res.status(400).json({ error: 'Invalid page or pageSize. Both must be positive integers.' });
    }
    const offset = (page - 1) * pageSize;

    try {
      const totalStmt = db.prepare('SELECT COUNT(*) as count FROM Reservation');
      const total = totalStmt.get().count;

      const stmt = db.prepare('SELECT * FROM Reservation LIMIT ? OFFSET ?');
      const reservations = stmt.all(pageSize, offset);

      res.status(200).json({
        data: reservations,
        total,
        page,
        pageSize,
        maxPages: Math.ceil(total / pageSize)
      });
    } catch (error) {
      console.error("Error fetching reservations:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Get reservation by ID
  router.get('/:reservationId', authenticateToken, (req, res) => {
    const reservationId = parseInt(req.params.reservationId, 10);

    // Input validation
    if (isNaN(reservationId) || !Number.isInteger(reservationId)) {
      return res.status(400).json({ error: 'Invalid reservationId. It must be an integer.' });
    }

    try {
      const stmt = db.prepare('SELECT * FROM Reservation WHERE reservationId = ?');
      const reservation = stmt.get(reservationId);

      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found.' });
      }

      res.status(200).json(reservation);
    } catch (error) {
      console.error("Error fetching reservation:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
};