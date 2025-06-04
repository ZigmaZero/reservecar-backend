import express from 'express';
import authenticateToken from '../middlewares/authenticateToken.js';
import {
  getReservations,
  getReservationsCount,
  getReservationById
} from '../services/reservationService.js';
import authorizeAsAdmin from '../middlewares/authorizeAsAdmin.js';

const router = express.Router();

// Get all reservations with pagination
router.get('/', authenticateToken, authorizeAsAdmin, (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  if (page < 1 || pageSize < 1) {
    return res.status(400).json({ error: 'Invalid page or pageSize. Both must be positive integers.' });
  }
  const offset = (page - 1) * pageSize;

  try {
    const total = getReservationsCount();
    const reservations = getReservations(pageSize, offset);

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
router.get('/:reservationId', authenticateToken, authorizeAsAdmin, (req, res) => {
  const reservationId = parseInt(req.params.reservationId, 10);

  if (isNaN(reservationId) || !Number.isInteger(reservationId)) {
    return res.status(400).json({ error: 'Invalid reservationId. It must be an integer.' });
  }

  try {
    const reservation = getReservationById(reservationId);

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    res.status(200).json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;