import express, { Response } from 'express';
import logger from '../logger.js';
import authenticateToken from '../middlewares/authenticateToken.js';
import {
  getReservations,
  getReservationsCount,
  getReservationById,
  getReservationsBetweenTime
} from '../services/reservationService.js';
import authorizeAsAdmin from '../middlewares/authorizeAsAdmin.js';
import AuthenticatedRequest from '../interfaces/authenticatedRequest.js';

const router = express.Router();

// Get all reservations with pagination
router.get('/', authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
  if (page < 0 || pageSize < 1) {
    res.status(400).json({ error: 'Invalid page or pageSize.' });
    return;
  }
  const offset = page * pageSize;

  try {
    const total = getReservationsCount();
    const reservations = getReservations(pageSize, offset);

    res.status(200).json({
      data: reservations,
      total,
      page,
      pageSize,
      maxPages: Math.max(1, Math.ceil(total / pageSize))
    });
  } catch (error) {
    logger.error("Error fetching reservations:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Export all reservations in time range
router.get('/export', authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const startTime = req.query.startTime
    ? new Date(req.query.startTime as string)
    : new Date('1970-01-01T00:00:00.000Z');
  const endTime = req.query.endTime
    ? new Date(req.query.endTime as string)
    : new Date('9999-12-31T23:59:59.999Z');
  res.status(200).json(getReservationsBetweenTime(startTime, endTime));
})

// Get reservation by ID
router.get('/:reservationId', authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
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
    logger.error("Error fetching reservation:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;