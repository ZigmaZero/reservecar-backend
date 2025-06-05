import express, { Request, Response } from 'express';
import logger from '../logger.js';
import authenticateToken from '../middlewares/authenticateToken.js';
import authorizeAsAdmin from '../middlewares/authorizeAsAdmin.js';
import tokenMiddleware from '../middlewares/tokenMiddleware.js';
import {
  getCars,
  getCarsCount,
  getCarById,
  createCar,
  updateCar,
  deleteCar
} from '../services/carService.js';
import AuthenticatedRequest from '../interfaces/authenticatedRequest.js';

const router = express.Router();

// Get all cars with pagination
router.get('/', tokenMiddleware, authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
  if (page < 1 || pageSize < 1) {
    res.status(400).json({ error: 'Invalid page or pageSize. Both must be positive integers.' });
    return;
  }
  const offset = (page - 1) * pageSize;

  try {
    const total = getCarsCount();
    const cars = getCars(pageSize, offset);

    res.status(200).json({
      data: cars,
      total,
      page,
      pageSize,
      maxPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    logger.error("Error fetching cars:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get car by ID
router.get('/:carId', tokenMiddleware, authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const carId = parseInt(req.params.carId, 10);

  if (isNaN(carId) || !Number.isInteger(carId)) {
    res.status(400).json({ error: 'Invalid carId. It must be an integer.' });
    return;
  }

  try {
    const car = getCarById(carId);

    if (!car) {
      res.status(404).json({ error: 'Car not found.' });
      return;
    }

    res.status(200).json(car);
  } catch (error) {
    logger.error("Error fetching car:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new car
router.post('/', tokenMiddleware, authenticateToken, authorizeAsAdmin, (req, res) => {
  const { plateNumber, teamId } = req.body;

  if (typeof plateNumber !== 'string' 
      || plateNumber.trim() === '' 
      || typeof teamId !== 'number' 
      || !Number.isInteger(teamId)) {
    res.status(400).json({ error: 'Invalid plateNumber or teamId.' });
    return;
  }

  try {
    const result = createCar(plateNumber, teamId);
    res.status(201).json({ carId: result.lastInsertRowid, plateNumber, teamId });
  } catch (error) {
    logger.error("Error creating car:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a car's plate number and team
router.put('/:carId', tokenMiddleware, authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const carId = parseInt(req.params.carId, 10);
  const { plateNumber, teamId } = req.body;

  if (isNaN(carId) 
    || !Number.isInteger(carId) 
    || typeof plateNumber !== 'string' 
    || plateNumber.trim() === '' 
    || typeof teamId !== 'number' 
    || !Number.isInteger(teamId)) {
    res.status(400).json({ error: 'Invalid carId, plateNumber, or teamId.' });
    return;
  }

  try {
    const result = updateCar(carId, plateNumber, teamId);

    if(result.changes === 0) {
      res.status(404).json({ error: 'Car not found.' });
      return;
    }

    res.status(200).json({ message: 'Car updated successfully.' });
  } catch (error) {
    logger.error("Error updating car:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a car
router.delete('/:carId', tokenMiddleware, authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const carId = parseInt(req.params.carId, 10);

  if (isNaN(carId) || !Number.isInteger(carId)) {
    res.status(400).json({ error: 'Invalid carId. It must be an integer.' });
    return;
  }

  try {
    const result = deleteCar(carId, new Date().toISOString());

    if (result.changes === 0) {
      res.status(404).json({ error: 'Car not found.' });
      return;
    }

    res.status(200).json({ message: 'Car deleted successfully.' });
  } catch (error) {
    logger.error("Error deleting car:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;