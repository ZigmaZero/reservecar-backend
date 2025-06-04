import express from 'express';
import authenticateToken from '../middlewares/authenticateToken.js';
import {
  getTeams,
  getTeamsCount,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeamAndUnassignMembers
} from '../services/teamService.js';
import authorizeAsAdmin from '../middlewares/authorizeAsAdmin.js';

const router = express.Router();

router.get('/', authenticateToken, authorizeAsAdmin, (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  if (page < 1 || pageSize < 1) {
    return res.status(400).json({ error: 'Invalid page or pageSize. Both must be positive integers.' });
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
    console.error("Error fetching teams:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get team by ID
router.get('/:teamId', authenticateToken, authorizeAsAdmin, (req, res) => {
  const teamId = parseInt(req.params.teamId, 10);

  if (isNaN(teamId) || !Number.isInteger(teamId)) {
    return res.status(400).json({ error: 'Invalid teamId. It must be an integer.' });
  }

  try {
    const team = getTeamById(teamId);

    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    res.status(200).json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new team
router.post('/', authenticateToken, authorizeAsAdmin, (req, res) => {
  const { name } = req.body;

  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Invalid team name.' });
  }

  try {
    const result = createTeam(name);
    res.status(201).json({ teamId: result.lastInsertRowid, name });
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a team's name
router.put('/:teamId', authenticateToken, authorizeAsAdmin, (req, res) => {
  const teamId = parseInt(req.params.teamId, 10);
  const { name } = req.body;

  if (
    isNaN(teamId) ||
    !Number.isInteger(teamId) ||
    typeof name !== 'string' ||
    name.trim() === ''
  ) {
    return res.status(400).json({ error: 'Invalid teamId or team name.' });
  }

  try {
    const result = updateTeam(teamId, name);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    res.status(200).json({ message: 'Team updated successfully.' });
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a team
router.delete('/:teamId', authenticateToken, authorizeAsAdmin, (req, res) => {
  const teamId = parseInt(req.params.teamId, 10);

  if (isNaN(teamId) || !Number.isInteger(teamId)) {
    return res.status(400).json({ error: 'Invalid teamId. It must be an integer.' });
  }

  try {
    const result = deleteTeamAndUnassignMembers(teamId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    res.status(200).json({ message: 'Team deleted successfully. All members have been unassigned.' });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;