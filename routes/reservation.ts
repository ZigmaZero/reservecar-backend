import express, { Response } from 'express';
import authenticateToken from '../middlewares/authenticateToken.js';
import tokenMiddleware from '../middlewares/tokenMiddleware.js';
import {
  getReservations,
  getReservationsCount,
  getReservationById
} from '../services/reservationService.js';
import authorizeAsAdmin from '../middlewares/authorizeAsAdmin.js';
import AuthenticatedRequest from '../interfaces/authenticatedRequest.js';

const router = express.Router();

// Get all reservations with pagination
router.get('/', tokenMiddleware, authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
  if (page < 1 || pageSize < 1) {
    res.status(400).json({ error: 'Invalid page or pageSize. Both must be positive integers.' });
    return;
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
router.get('/:reservationId', tokenMiddleware, authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const reservationId = parseInt(req.params.reservationId, 10);

  if (isNaN(reservationId) || !Number.isInteger(reservationId)) {
    res.status(400).json({ error: 'Invalid reservationId. It must be an integer.' });
    return;
  }

  try {
    const reservation = getReservationById(reservationId);

    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found.' });
      return;
    }

    res.status(200).json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;