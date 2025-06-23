import express, { Response } from 'express';
import logger from '../logger.js';
import authenticateToken from '../middlewares/authenticateToken.js';
import {
  getEmployees,
  getEmployeesCount,
  getEmployeeById,
  verifyEmployee,
  removeEmployee,
  updateEmployee
} from '../services/employeeService.js';
import authorizeAsAdmin from '../middlewares/authorizeAsAdmin.js';
import AuthenticatedRequest from '../interfaces/authenticatedRequest.js';
import { message } from '../services/lineService.js';

const router = express.Router();

// Get all employees with pagination
router.get('/', authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 0;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
  const sortField = req.query.sortField ? req.query.sortField as string : undefined;
  const sortOrder = req.query.sortOrder ? req.query.sortOrder as string : undefined;
  const filterField = req.query.filterField ? req.query.filterField as string : undefined;
  const filterOp = req.query.filterOp ? req.query.filterOp as string : undefined;
  const filterValue = req.query.filterValue ? req.query.filterValue as string : undefined;

  if (page < 0 || pageSize < 1) {
    res.status(400).json({ 
      error: 'Invalid page or pageSize.' 
    });
    return;
  }
  const offset = page * pageSize;

  if (sortField !== "id" && sortField !== "teamId" && sortField !== "verified" && sortField !== "name" && sortField !== "teamName" && sortField !== undefined)
  {
    res.status(400).json({
      error: 'Invalid sortField.'
    });
    return;
  }

  if (sortOrder !== "asc" && sortOrder !== "desc" && sortOrder !== undefined)
  {
    res.status(400).json({ error: 'Invalid sortOrder.' });
    return;
  }

  if (filterField !== "id" && filterField !== "name" && filterField !== "verified" && filterField !== "teamId" && filterField !== "teamName" && filterField !== undefined)
  {
    res.status(400).json({ error: 'Invalid filterField.' });
    return;
  }

  if (filterOp !== "=" && filterOp !== "contains" && filterOp !== "is" && filterOp !== undefined)
  {
    res.status(400).json({ error: 'Invalid filterOp.' });
    return;
  }

  if (filterField === "id" || filterField === "teamId")
  {
    if (filterOp !== "=")
    {
      res.status(400).json({ error: 'Invalid filterOp.' });
    }
  }

  if (filterField === "name" || filterField === "teamName")
  {
    if (filterOp !== "contains")
    {
      res.status(400).json({ error: 'Invalid filterOp.' });
    }
  }

  if (filterField === "verified")
  {
    if (filterOp !== "is")
    {
      res.status(400).json({ error: 'Invalid filterOp.' });
    }
  }

  if (filterOp === "is")
  {
    if (filterValue !== "any" && filterValue !== "true" && filterValue !== "false" && filterValue !== undefined)
    {
      res.status(400).json({ error: 'Invalid filterValue.' });
    }
  }

  try {
    const total = getEmployeesCount();
    const employees = getEmployees(pageSize, offset, sortField, sortOrder, filterField, filterOp, filterValue);

    res.status(200).json({
      data: employees,
      total,
      page,
      pageSize,
      maxPages: Math.max(1, Math.ceil(total / pageSize))
    });
  } catch (error) {
    logger.error("Error fetching employees:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get employee by ID
router.get('/:userId', authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId) || !Number.isInteger(userId)) {
    res.status(400).json({ error: 'Invalid userId. It must be an integer.' });
    return;
  }

  try {
    const employee = getEmployeeById(userId);

    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    res.status(200).json(employee);
  } catch (error) {
    logger.error("Error fetching employee:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Verify employee (PUT)
router.put('/:userId/verify', authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId) || !Number.isInteger(userId)) {
    res.status(400).json({ error: 'Invalid userId. It must be an integer.' });
    return;
  }

  try {
    const result = verifyEmployee(userId);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Employee not found or already verified.' });
      return;
    }

    res.status(200).json({ message: 'Employee verified successfully.' });
  } catch (error) {
    logger.error("Error verifying employee:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// General update employee (PUT)
router.put('/:userId', authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const userId = parseInt(req.params.userId, 10);
  const oldUser = getEmployeeById(userId);
  if (!oldUser)
  {
    res.status(404).json({ error: 'Employee not found.' });
    return;
  }
  const { name, teamId } = req.body;
  if (isNaN(userId) || !Number.isInteger(userId)) {
    res.status(400).json({ error: 'Invalid userId. It must be an integer.' });
    return;
  }
  if (typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'Invalid name. It must be a non-empty string.' });
    return;
  }
  if (teamId && (isNaN(teamId) || !Number.isInteger(teamId))) {
    res.status(400).json({ error: 'Invalid teamId. It must be an integer.' });
    return;
  }
  try {
    const result = updateEmployee(userId, name.trim(), teamId);
  } catch (error) {
    logger.error("Error updating employee:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

  const newUser = getEmployeeById(userId);
  if (!newUser)
  {
    res.status(404).json({ error: 'Employee not found.' });
    return;
  }

  return message(
    oldUser.lineId, 
    `[Employee information changed]
    Hello ${oldUser.name}:
    An administrator has changed your employee information in the ReserveCar system.
    The changes are as follows:
    ${oldUser.name !== newUser?.name ? 
      `Old name: ${oldUser.name}
      New name: ${newUser?.name}` : ""}${oldUser.teamId !== newUser?.teamId ? 
      `Old team: ${oldUser.teamName || "None"}
      New team: ${newUser?.teamName || "None"}` : ""}
    The changes will be applied effective immediately.
    Thank you for using Jastel ReserveCar system.`
  ).then((result) => {
    if(result.success)
    {
      res.status(200).json({
        message: 'Employee updated successfully.', 
        line: result.message
      });
      return;
    }
    else
    {
      res.status(200).json({
        message: 'Employee updated successfully.',
        line: `Failed with status ${result.status} and error ${result.error}`
      });
      return;
    }
  })

});

// Delete an employee (DELETE)
router.delete('/:userId', authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId) || !Number.isInteger(userId)) {
    res.status(400).json({ error: 'Invalid userId. It must be an integer.' });
    return;
  }
  try {
    const result = removeEmployee(userId);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    res.status(200).json({ message: 'Employee deleted successfully.' });
  } catch (error) {
    logger.error("Error deleting employee:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;