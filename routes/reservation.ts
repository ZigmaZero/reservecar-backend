import express from 'express';
import authenticateToken from '../middlewares/authenticateToken.js';
import authorizeAsAdmin from '../middlewares/authorizeAsAdmin.js';
import { 
  reservationGetPaginatedController, 
  reservationExportController, 
  reservationGetByIdController, 
  reservationUpdateController 
} from '../controllers/reservationController.js';

const router = express.Router();

// Get all reservations with pagination
router.get('/', authenticateToken, authorizeAsAdmin, reservationGetPaginatedController());

// Export all reservations in time range
router.get('/export', authenticateToken, authorizeAsAdmin, reservationExportController())

// Get reservation by ID
router.get('/:reservationId', authenticateToken, authorizeAsAdmin, reservationGetByIdController());

router.put('/:reservationId', authenticateToken, authorizeAsAdmin, reservationUpdateController());

export default router;