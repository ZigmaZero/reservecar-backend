import AuthenticatedRequest from "../interfaces/authenticatedRequest.js";
import logger from "../logger.js";
import employeeDeleteMessage from "../messages/employeeDeleteMessage.js";
import employeeUpdateMessage from "../messages/employeeUpdateMessage.js";
import employeeVerifyMessage from "../messages/employeeVerifyMessage.js";
import { getEmployeeById, getEmployees, getEmployeesCount, removeEmployee, updateEmployee, verifyEmployee } from "../services/employeeService.js";
import { message } from "../services/lineService.js";
import { Response } from "express";

export function employeeGetByIdController() {
  return (req: AuthenticatedRequest, res: Response) => {
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
  };
}

export function employeeGetPaginatedController() {
  return (req: AuthenticatedRequest, res: Response) => {
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

    if (sortField !== "id" && sortField !== "teamId" && sortField !== "verified" && sortField !== "name" && sortField !== "teamName" && sortField !== undefined) {
      res.status(400).json({
        error: 'Invalid sortField.'
      });
      return;
    }

    if (sortOrder !== "asc" && sortOrder !== "desc" && sortOrder !== undefined) {
      res.status(400).json({ error: 'Invalid sortOrder.' });
      return;
    }

    if (filterField !== "id" && filterField !== "name" && filterField !== "verified" && filterField !== "teamId" && filterField !== "teamName" && filterField !== undefined) {
      res.status(400).json({ error: 'Invalid filterField.' });
      return;
    }

    if (filterOp !== "=" && filterOp !== "contains" && filterOp !== "is" && filterOp !== undefined) {
      res.status(400).json({ error: 'Invalid filterOp.' });
      return;
    }

    if (filterField === "id" || filterField === "teamId") {
      if (filterOp !== "=") {
        res.status(400).json({ error: 'Invalid filterOp.' });
      }
    }

    if (filterField === "name" || filterField === "teamName") {
      if (filterOp !== "contains") {
        res.status(400).json({ error: 'Invalid filterOp.' });
      }
    }

    if (filterField === "verified") {
      if (filterOp !== "is") {
        res.status(400).json({ error: 'Invalid filterOp.' });
      }
    }

    if (filterOp === "is") {
      if (filterValue !== "any" && filterValue !== "true" && filterValue !== "false" && filterValue !== undefined) {
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
  };
}



export function employeeDeleteController() {
  return (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId) || !Number.isInteger(userId)) {
      res.status(400).json({ error: 'Invalid userId. It must be an integer.' });
      return;
    }
    try {
      const user = getEmployeeById(userId);
      const result = removeEmployee(userId);

      if (result.changes === 0 || !user) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }

      return message(user.lineId, employeeDeleteMessage(user)).then((result) => {
        if (result.success) {
          res.status(200).json({
            message: 'Employee deleted successfully.',
            line: result.message
          });
          return;
        }

        else {
          res.status(200).json({
            message: 'Employee deleted successfully.',
            line: `Failed with status ${result.status} and error ${result.error}`
          });
          return;
        }
      });

    } catch (error) {
      logger.error("Error deleting employee:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

export function employeeUpdateController() {
  return (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.userId, 10);
    let oldUser;
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
      oldUser = getEmployeeById(userId);
      const result = updateEmployee(userId, name.trim(), teamId);
    } catch (error) {
      logger.error("Error updating employee:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }

    if (!oldUser) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const newUser = getEmployeeById(userId);
    if (!newUser) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    return message(
      oldUser.lineId,
      employeeUpdateMessage(oldUser, newUser)
    ).then((result) => {
      if (result.success) {
        res.status(200).json({
          message: 'Employee updated successfully.',
          line: result.message
        });
        return;
      }

      else {
        res.status(200).json({
          message: 'Employee updated successfully.',
          line: `Failed with status ${result.status} and error ${result.error}`
        });
        return;
      }
    });

  };
}

export function employeeVerifyController() {
  return (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId) || !Number.isInteger(userId)) {
      res.status(400).json({ error: 'Invalid userId. It must be an integer.' });
      return;
    }

    try {
      const user = getEmployeeById(userId);
      const result = verifyEmployee(userId);

      if (result.changes === 0) {
        res.status(404).json({ error: 'Employee not found or already verified.' });
        return;
      }

      if (!user) {
        res.status(404).json({ error: 'Employee not found or already verified.' });
        return;
      }

      return message(user.lineId, employeeVerifyMessage(user)).then((result) => {
        if (result.success) {
          res.status(200).json({
            message: 'Employee verified successfully.',
            line: result.message
          });
          return;
        }

        else {
          res.status(200).json({
            message: 'Employee verified successfully.',
            line: `Failed with status ${result.status} and error ${result.error}`
          });
          return;
        }
      });
    } catch (error) {
      logger.error("Error verifying employee:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}