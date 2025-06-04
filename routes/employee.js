import express from 'express';
import authenticateToken from '../middlewares/authenticateToken.js';
import {
  getEmployees,
  getEmployeesCount,
  getEmployeeById,
  verifyEmployee,
  assignEmployeeToTeam
} from '../services/employeeService.js';
import authorizeAsAdmin from '../middlewares/authorizeAsAdmin.js';

const router = express.Router();

// Get all employees with pagination
router.get('/', authenticateToken, authorizeAsAdmin, (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  if (page < 1 || pageSize < 1) {
    return res.status(400).json({ 
      error: 'Invalid page or pageSize. Both must be positive integers.' 
    });
  }
  const offset = (page - 1) * pageSize;

  try {
    const total = getEmployeesCount();
    const employees = getEmployees(pageSize, offset);

    res.status(200).json({
      data: employees,
      total,
      page,
      pageSize,
      maxPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get employee by ID
router.get('/:userId', authenticateToken, authorizeAsAdmin, (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId) || !Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Invalid userId. It must be an integer.' });
  }

  try {
    const employee = getEmployeeById(userId);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Verify employee (PUT)
router.put('/:userId/verify', authenticateToken, authorizeAsAdmin, (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId) || !Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Invalid userId. It must be an integer.' });
  }

  try {
    const result = verifyEmployee(userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Employee not found or already verified.' });
    }

    res.status(200).json({ message: 'Employee verified successfully.' });
  } catch (error) {
    console.error("Error verifying employee:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Assign employee to team (PUT)
router.put('/:userId/team', authenticateToken, authorizeAsAdmin, (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const { teamId } = req.body;

  if (
    isNaN(userId) ||
    !Number.isInteger(userId) ||
    isNaN(teamId) ||
    !Number.isInteger(teamId)
  ) {
    return res.status(400).json({ error: 'Invalid userId or teamId. Both must be integers.' });
  }

  try {
    const result = assignEmployeeToTeam(userId, teamId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    res.status(200).json({ message: 'Employee assigned to team successfully.' });
  } catch (error) {
    console.error("Error assigning employee to team:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;