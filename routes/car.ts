import express from 'express';
import authenticateToken from '../middlewares/authenticateToken.js';
import authorizeAsAdmin from '../middlewares/authorizeAsAdmin.js';
import { 
    carGetPaginatedController, 
    carGetByIdController, 
    carCreateController, 
    carUpdateController, 
    carDeleteController 
} from '../controllers/carController.js';

const router = express.Router();

// Get all cars with pagination
router.get('/', authenticateToken, authorizeAsAdmin, carGetPaginatedController());

// Get car by ID
router.get('/:carId', authenticateToken, authorizeAsAdmin, carGetByIdController());

// Create a new car
router.post('/', authenticateToken, authorizeAsAdmin, carCreateController());

// Update a car's plate number and team
router.put('/:carId', authenticateToken, authorizeAsAdmin, carUpdateController());

// Delete a car
router.delete('/:carId', authenticateToken, authorizeAsAdmin, carDeleteController());

export default router;