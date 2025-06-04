import express, { Request, Response } from 'express';
import { getEmployeeById } from '../services/employeeService.js';
import { getCarById } from '../services/carService.js';
import { 
  createReservation, 
  getReservationById, 
  checkoutReservation 
} from '../services/reservationService.js';

const router = express.Router();

// Checkin
router.post('/checkin', (req: Request, res: Response) => {
  const { userId, carId } = req.body;
  const checkinTime = new Date().toISOString();

  // Input validation
  if (
    typeof userId !== 'number' ||
    typeof carId !== 'number' ||
    !Number.isInteger(userId) ||
    !Number.isInteger(carId)
  ) {
    res.status(400).json({ error: 'Invalid userId or carId. Both must be integers.' });
    return;
  }

  // Check if user exists
  const user = getEmployeeById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  // Check if car exists
  const car = getCarById(carId);
  if (!car) {
    res.status(404).json({ error: 'Car not found.' });
    return;
  }

  try {
    const result = createReservation(userId, carId, checkinTime);
    res.status(201).json({ reservationId: result.lastInsertRowid });
  } catch (error) {
    console.error("Error during check-in:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Checkout
router.post('/checkout', (req: Request, res: Response) => {
  const { reservationId } = req.body;
  const checkoutTime = new Date().toISOString();

  // Input validation
  if (typeof reservationId !== 'number' || !Number.isInteger(reservationId)) {
    res.status(400).json({ error: 'Invalid reservationId. It must be an integer.' });
    return;
  }

  // Check if reservation exists
  const reservation = getReservationById(reservationId);
  if (!reservation) {
    res.status(404).json({ error: 'Reservation not found.' });
    return;
  }

  try {
    checkoutReservation(reservationId, checkoutTime);
    res.status(200).json({ message: 'Checkout successful.' });
  } catch (error) {
    console.error("Error during checkout:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;