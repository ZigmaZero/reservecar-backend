import express from 'express';
import authenticateToken from '../middlewares/authenticateToken.js';
import authorizeAsAdmin from '../middlewares/authorizeAsAdmin.js';
import { 
  teamGetPaginatedController, 
  teamGetController, 
  teamGetByIdController, 
  teamCreateController, 
  teamUpdateController, 
  teamDeleteController 
} from '../controllers/teamController.js';

const router = express.Router();

router.get('/', authenticateToken, authorizeAsAdmin, teamGetPaginatedController());

// Get all teams w/o pagination
router.get('/all', authenticateToken, teamGetController());

// Get team by ID
router.get('/:teamId', authenticateToken, authorizeAsAdmin, teamGetByIdController());

// Create a new team
router.post('/', authenticateToken, authorizeAsAdmin, teamCreateController());

// Update a team's name
router.put('/:teamId', authenticateToken, authorizeAsAdmin, teamUpdateController());

// Delete a team
router.delete('/:teamId', authenticateToken, authorizeAsAdmin, teamDeleteController());

export default router;

