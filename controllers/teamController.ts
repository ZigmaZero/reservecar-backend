import AuthenticatedRequest from "../interfaces/authenticatedRequest.js";
import logger from "../logger.js";
import teamUpdateMessage from "../messages/teamUpdateMessage.js";
import { getCarsByTeam } from "../services/carService.js";
import { getEmployeesInTeam } from "../services/employeeService.js";
import { messageMany } from "../services/lineService.js";
import { deleteTeamAndUnassignMembers, getTeamById, updateTeam, createTeam, getTeams, getTeamsCount, getTeamsPaginated } from "../services/teamService.js";
import { Response } from 'express'

export function teamDeleteController() {
  return (req: AuthenticatedRequest, res: Response) => {
    const teamId = parseInt(req.params.teamId, 10);

    const cars = getCarsByTeam(teamId);
    if (cars.length !== 0) {
      res.status(400).json({ error: 'Cannot remove team while cars are assigned to it. ' });
      return;
    }

    const employees = getEmployeesInTeam(teamId);
    if (employees.length !== 0) {
      res.status(400).json({ error: 'Cannot remove team while employees are assigned to it. ' });
    }

    if (isNaN(teamId) || !Number.isInteger(teamId)) {
      res.status(400).json({ error: 'Invalid teamId. It must be an integer.' });
      return;
    }

    try {
      const result = deleteTeamAndUnassignMembers(teamId);

      if (result.changes === 0) {
        res.status(404).json({ error: 'Team not found.' });
        return;
      }

      res.status(200).json({ message: 'Team deleted successfully. All members have been unassigned.' });
    } catch (error) {
      logger.error("Error deleting team:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

export function teamUpdateController() {
  return (req: AuthenticatedRequest, res: Response) => {
    const teamId = parseInt(req.params.teamId, 10);
    const { name } = req.body;

    if (isNaN(teamId) ||
      !Number.isInteger(teamId) ||
      typeof name !== 'string' ||
      name.trim() === '') {
      res.status(400).json({ error: 'Invalid teamId or team name.' });
      return;
    }

    try {
      const oldTeam = getTeamById(teamId);
      const result = updateTeam(teamId, name.trim());
      const newTeam = getTeamById(teamId);
      const employees = getEmployeesInTeam(teamId);
      if (!oldTeam || !newTeam || result.changes === 0) {
        res.status(404).json({ error: 'Team not found.' });
        return;
      }

      messageMany(
        employees.map((employee) => (employee.lineId)),
        teamUpdateMessage(oldTeam, newTeam)
      ).then((result) => {
        if (result.success) {
          res.status(200).json({
            message: 'Team updated successfully.',
            line: result.message
          });
          return;
        }

        else {
          res.status(200).json({
            message: 'Team updated successfully.',
            line: `Failed with status ${result.status} and error ${result.error}`
          });
          return;
        }
      });

    } catch (error) {
      logger.error("Error updating team:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

export function teamCreateController() {
  return (req: AuthenticatedRequest, res: Response) => {
    const { name } = req.body;

    if (typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'Invalid team name.' });
      return;
    }

    try {
      const result = createTeam(name.trim());
      res.status(201).json({ success: true });
    } catch (error) {
      logger.error("Error creating team:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

export function teamGetByIdController() {
  return (req: AuthenticatedRequest, res: Response) => {
    const teamId = parseInt(req.params.teamId, 10);

    if (isNaN(teamId) || !Number.isInteger(teamId)) {
      res.status(400).json({ error: 'Invalid teamId. It must be an integer.' });
      return;
    }

    try {
      const team = getTeamById(teamId);

      if (!team) {
        res.status(404).json({ error: 'Team not found.' });
        return;
      }

      res.status(200).json(team);
    } catch (error) {
      logger.error("Error fetching team:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

export function teamGetController() {
  return (req: AuthenticatedRequest, res: Response) => {
    try {
      const teams = getTeams(); // Fetch all teams w/o pagination
      if (!teams || teams.length === 0) {
        res.status(200).json({ teams: [] });
        return;
      }

      res.status(200).json({ teams: teams });
    } catch (error) {
      logger.error("Error fetching teams:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

export function teamGetPaginatedController() {
  return (req: AuthenticatedRequest, res: Response) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 0;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
    const sortField = req.query.sortField ? req.query.sortField as string : undefined;
    const sortOrder = req.query.sortOrder ? req.query.sortOrder as string : undefined;
    const filterField = req.query.filterField ? req.query.filterField as string : undefined;
    const filterOp = req.query.filterOp ? req.query.filterOp as string : undefined;
    const filterValue = req.query.filterValue ? req.query.filterValue as string : undefined;

    if (page < 0 || pageSize < 1) {
      res.status(400).json({ error: 'Invalid page or pageSize.' });
      return;
    }
    const offset = page * pageSize;

    if (sortField !== "id" && sortField !== "name" && sortField !== undefined) {
      res.status(400).json({
        error: 'Invalid sortField.'
      });
      return;
    }

    if (sortOrder !== "asc" && sortOrder !== "desc" && sortOrder !== undefined) {
      res.status(400).json({ error: 'Invalid sortOrder.' });
      return;
    }

    if (filterField !== "id" && filterField !== "name" && filterField !== undefined) {
      res.status(400).json({ error: 'Invalid filterField.' });
      return;
    }

    if (filterOp !== "=" && filterOp != "contains" && filterOp !== undefined) {
      res.status(400).json({ error: 'Invalid filterOp' });
      return;
    }

    if (filterField === "id" && filterOp !== "=") {
      res.status(400).json({ error: 'Invalid filterOp' });
      return;
    }

    if (filterField === "name" && filterOp !== "contains") {
      res.status(400).json({ error: 'Invalid filterOp' });
      return;
    }

    try {
      const total = getTeamsCount();
      const teams = getTeamsPaginated(pageSize, offset, sortField, sortOrder, filterField, filterOp, filterValue);

      res.status(200).json({
        data: teams,
        total,
        page,
        pageSize,
        maxPages: Math.max(1, Math.ceil(total / pageSize))
      });
    } catch (error) {
      logger.error("Error fetching teams:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
