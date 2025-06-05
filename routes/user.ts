import express, { Request, Response } from 'express';
import { getEmployeeById, createEmployee, getEmployeeByName } from '../services/employeeService.js';
import { getCarById } from '../services/carService.js';
import { 
  createReservation, 
  getReservationById, 
  checkoutReservation 
} from '../services/reservationService.js';
import generateAccessToken from '../utils/generateAccessToken.js';
import setTokenAsCookie from '../utils/setTokenAsCookie.js';
import tokenMiddleware from '../middlewares/tokenMiddleware.js';
import authorizeAsEmployee from '../middlewares/authorizeAsEmployee.js';
import AuthenticatedRequest from '../interfaces/authenticatedRequest.js';
import authenticateToken from '../middlewares/authenticateToken.js';
import logger from '../logger.js';

const router = express.Router();

router.post('/register', (req: Request, res: Response) => {
  const { fullName } = req.body;
  // Input validation
  if (typeof fullName !== 'string' || fullName.trim() === '') {
    res.status(400).json({ error: 'Invalid fullName. It must be a non-empty string.' });
    return;
  }
  // Enter user to database
  try {
    const result = createEmployee(fullName);
    if(!result || !result.lastInsertRowid) {
      res.status(500).json({ error: 'Failed to register user.' });
      return;
    }

    // get user from userId of result
    const user = getEmployeeById(result.lastInsertRowid as number);
    if (!user) {
      res.status(500).json({ error: 'User not found after registration.' });
      return;
    }

    // Generate JWT token and set it as a cookie
    const token = generateAccessToken(user);
    setTokenAsCookie(token, req, res);

    res.status(201).json({ success: true });
  } catch (error) {
    logger.error("Error during registration:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.post('/login', (req: Request, res: Response) => {
  // TODO: after LINE Login, get userId from LINE API instead.
  const { fullName } = req.body;
  // Input validation
  if (typeof fullName !== 'string' || fullName.trim() === '') {
    res.status(400).json({ error: 'Invalid fullName. It must be a non-empty string.' });
    return;
  }
  // Check if user exists
  try {
    const user = getEmployeeByName(fullName);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    // Generate JWT token and set it as a cookie
    const token = generateAccessToken(user);
    setTokenAsCookie(token, req, res);

    res.status(201).json({ success: true, verified: user.verified });
  } catch (error) {
    logger.error("Error during login:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Check verification status
router.get('/verify', tokenMiddleware, authenticateToken, authorizeAsEmployee, (req: AuthenticatedRequest, res: Response) => {
  if(!req.employee)
  {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Return user information
    res.status(200).json({
      fullName: req.employee.name,
      verified: req.employee.verified
    });
  } catch (error) {
    logger.error("Error during verification:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

});

// Checkin
router.post('/checkin', tokenMiddleware, authenticateToken, authorizeAsEmployee, (req: AuthenticatedRequest, res: Response) => {
  const { carId } = req.body;
  const userId = req.employee?.userId;
  const checkinTime = new Date().toISOString();

  // Input validation
  if (
    typeof userId !== 'number' ||
    typeof carId !== 'number' ||
    !Number.isInteger(userId) ||
    !Number.isInteger(carId)
  ) {
    res.status(400).json({ error: 'Invalid User or Car.' });
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

    if (!result || !result.lastInsertRowid) {
      res.status(500).json({ error: 'Failed to create reservation.' });
      return;
    }

    res.status(201).json({ success: true });
  } catch (error) {
    logger.error("Error during check-in:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Checkout
router.post('/checkout', tokenMiddleware, authenticateToken, authorizeAsEmployee, (req: AuthenticatedRequest, res: Response) => {
  const { reservationId } = req.body;
  const userId = req.employee?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

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

  // Check if the reservation belongs to the user
  if (reservation.userId !== userId) {
    res.status(403).json({ error: 'Forbidden.' });
    return;
  }

  // Check if the reservation is already checked out
  if (reservation.checkoutTime) {
    res.status(400).json({ error: 'Reservation already checked out.' });
    return;
  }

  try {
    checkoutReservation(reservationId, checkoutTime);
    res.status(200).json({ message: 'Checkout successful.' });
  } catch (error) {
    logger.error("Error during checkout:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;