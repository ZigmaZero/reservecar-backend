import express from 'express';
import authenticateToken from '../middlewares/authenticateToken.js';
import authorizeAsAdmin from '../middlewares/authorizeAsAdmin.js';
import { employeeGetPaginatedController, employeeGetByIdController, employeeVerifyController, employeeUpdateController, employeeDeleteController } from '../controllers/employeeController.js';

const router = express.Router();

// Get all employees with pagination
router.get('/', authenticateToken, authorizeAsAdmin, employeeGetPaginatedController());

// Get employee by ID
router.get('/:userId', authenticateToken, authorizeAsAdmin, employeeGetByIdController());

// Verify employee (PUT)
router.put('/:userId/verify', authenticateToken, authorizeAsAdmin, employeeVerifyController());

// General update employee (PUT)
router.put('/:userId', authenticateToken, authorizeAsAdmin, employeeUpdateController());

// Delete an employee (DELETE)
router.delete('/:userId', authenticateToken, authorizeAsAdmin, employeeDeleteController());

export default router;