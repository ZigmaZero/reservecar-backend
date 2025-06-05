import express, {Response} from 'express';
import logger from '../logger.js';
import authenticateToken from '../middlewares/authenticateToken.js';
import tokenMiddleware from '../middlewares/tokenMiddleware.js';
import {
  getTeams,
  getTeamsCount,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeamAndUnassignMembers
} from '../services/teamService.js';
import authorizeAsAdmin from '../middlewares/authorizeAsAdmin.js';
import AuthenticatedRequest from '../interfaces/authenticatedRequest.js';

const router = express.Router();

router.get('/', authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
  if (page < 1 || pageSize < 1) {
    res.status(400).json({ error: 'Invalid page or pageSize. Both must be positive integers.' });
    return;
  }
  const offset = (page - 1) * pageSize;

  try {
    const total = getTeamsCount();
    const teams = getTeams(pageSize, offset);

    res.status(200).json({
      data: teams,
      total,
      page,
      pageSize,
      maxPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    logger.error("Error fetching teams:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get team by ID
router.get('/:teamId', authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
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
});

// Create a new team
router.post('/', authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;

  if (typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'Invalid team name.' });
    return;
  }

  try {
    const result = createTeam(name);
    res.status(201).json({ teamId: result.lastInsertRowid, name });
  } catch (error) {
    logger.error("Error creating team:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a team's name
router.put('/:teamId', authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const teamId = parseInt(req.params.teamId, 10);
  const { name } = req.body;

  if (
    isNaN(teamId) ||
    !Number.isInteger(teamId) ||
    typeof name !== 'string' ||
    name.trim() === ''
  ) {
    res.status(400).json({ error: 'Invalid teamId or team name.' });
    return;
  }

  try {
    const result = updateTeam(teamId, name);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }

    res.status(200).json({ message: 'Team updated successfully.' });
  } catch (error) {
    logger.error("Error updating team:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a team
router.delete('/:teamId', authenticateToken, authorizeAsAdmin, (req: AuthenticatedRequest, res: Response) => {
  const teamId = parseInt(req.params.teamId, 10);

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
});

export default router;