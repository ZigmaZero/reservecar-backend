import express from 'express';

const router = express.Router();

export default (db, authenticateToken) => {
  // Get all employees with pagination
  // GET /employees?page=1&pageSize=10
  router.get('/', authenticateToken, (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    if (page < 1 || pageSize < 1) {
      return res.status(400).json({ 
        error: 'Invalid page or pageSize. Both must be positive integers.' 
      });
    }
    const offset = (page - 1) * pageSize;

    try {
      const totalStmt = db.prepare('SELECT COUNT(*) as count FROM Employee');
      const total = totalStmt.get().count;

      const stmt = db.prepare('SELECT * FROM Employee LIMIT ? OFFSET ?');
      const employees = stmt.all(pageSize, offset);

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
  router.get('/:userId', authenticateToken, (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId) || !Number.isInteger(userId)) {
      return res.status(400).json({ error: 'Invalid userId. It must be an integer.' });
    }

    try {
      const stmt = db.prepare('SELECT * FROM Employee WHERE userId = ?');
      const employee = stmt.get(userId);

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
  router.put('/:userId/verify', authenticateToken, (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId) || !Number.isInteger(userId)) {
      return res.status(400).json({ error: 'Invalid userId. It must be an integer.' });
    }

    try {
      const stmt = db.prepare('UPDATE Employee SET verified = 1 WHERE userId = ?');
      const result = stmt.run(userId);

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
  router.put('/:userId/team', authenticateToken, (req, res) => {
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
      const stmt = db.prepare('UPDATE Employee SET teamId = ? WHERE userId = ?');
      const result = stmt.run(teamId, userId);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Employee not found.' });
      }

      res.status(200).json({ message: 'Employee assigned to team successfully.' });
    } catch (error) {
      console.error("Error assigning employee to team:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
};