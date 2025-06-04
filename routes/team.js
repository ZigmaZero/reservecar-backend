import express from 'express';
import db from '../db.js';
import authenticateToken from '../middlewares/authenticateToken.js';
const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
const page = parseInt(req.query.page, 10) || 1;
const pageSize = parseInt(req.query.pageSize, 10) || 10;
if (page < 1 || pageSize < 1) {
    return res.status(400).json({ error: 'Invalid page or pageSize. Both must be positive integers.' });
}
const offset = (page - 1) * pageSize;

try {
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM Team');
    const total = totalStmt.get().count;

    const stmt = db.prepare('SELECT * FROM Team LIMIT ? OFFSET ?');
    const teams = stmt.all(pageSize, offset);

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
router.get('/:teamId', authenticateToken, (req, res) => {
const teamId = parseInt(req.params.teamId, 10);

if (isNaN(teamId) || !Number.isInteger(teamId)) {
    return res.status(400).json({ error: 'Invalid teamId. It must be an integer.' });
}

try {
    const stmt = db.prepare('SELECT * FROM Team WHERE teamId = ?');
    const team = stmt.get(teamId);

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
router.post('/', authenticateToken, (req, res) => {
const { name } = req.body;

if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Invalid team name.' });
}

try {
    const stmt = db.prepare('INSERT INTO Team (name) VALUES (?)');
    const result = stmt.run(name);
    res.status(201).json({ teamId: result.lastInsertRowid, name });
} catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});

// Update a team's name
router.put('/:teamId', authenticateToken, (req, res) => {
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
    const stmt = db.prepare('UPDATE Team SET name = ? WHERE teamId = ?');
    const result = stmt.run(name, teamId);

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
router.delete('/:teamId', authenticateToken, (req, res) => {
const teamId = parseInt(req.params.teamId, 10);

if (isNaN(teamId) || !Number.isInteger(teamId)) {
    return res.status(400).json({ error: 'Invalid teamId. It must be an integer.' });
}

try {
    // Run both statements in a transaction
    const deleteTeamTransaction = db.transaction((teamId) => {
    db.prepare('UPDATE Employee SET teamId = NULL WHERE teamId = ?').run(teamId);
    const stmt = db.prepare('DELETE FROM Team WHERE teamId = ?');
    const result = stmt.run(teamId);
    return result;
    });

    const result = deleteTeamTransaction(teamId);

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