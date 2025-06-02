import 'dotenv/config';

import express from 'express';
import Database from 'better-sqlite3';
import { initDbStatement } from './db_init.js';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const port = 3000;
const db = new Database(process.env.DATABASE_NAME || 'database.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

// Function to generate JWT token
function generateAccessToken(user) {
  return jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
}

// Create database tables if they do not exist
try {
  initDbStatement(db);
} catch (error) {
  console.error("Error initializing database:", error);
}

// Middleware to parse JSON
app.use(express.json());
// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    console.log(err)

    if (err) return res.sendStatus(403)

    req.user = user

    next()
  })
}

// Configure CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Checkin
app.post('/checkin', (req, res) => {
  const { userId, carId } = req.body;
  const checkinTime = new Date().toISOString();

  // Input validation
  if (
    typeof userId !== 'number' ||
    typeof carId !== 'number' ||
    !Number.isInteger(userId) ||
    !Number.isInteger(carId)
  ) {
    return res.status(400).json({ error: 'Invalid userId or carId. Both must be integers.' });
  }

  // Check if user exists
  const user = db.prepare('SELECT 1 FROM Employee WHERE userId = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Check if car exists
  const car = db.prepare('SELECT 1 FROM Car WHERE carId = ?').get(carId);
  if (!car) {
    return res.status(404).json({ error: 'Car not found.' });
  }

  try {
    const stmt = db.prepare('INSERT INTO Reservation (userId, carId, checkinTime) VALUES (?, ?, ?)');
    const result = stmt.run(userId, carId, checkinTime);
    res.status(201).json({ reservationId: result.lastInsertRowid });
  } catch (error) {
    console.error("Error during check-in:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Checkout
app.post('/checkout', (req, res) => {
  const { reservationId } = req.body;
  const checkoutTime = new Date().toISOString();

  // Input validation
  if (typeof reservationId !== 'number' || 
    !Number.isInteger(reservationId)) {
    return res.status(400).json({ error: 'Invalid reservationId. It must be an integer.' });
  }

  // Check if reservation exists
  const reservation = db.prepare('SELECT * FROM Reservation WHERE reservationId = ?').get(reservationId);
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found.' });
  }

  try {
    const stmt = db.prepare('UPDATE Reservation SET checkoutTime = ? WHERE reservationId = ?');
    stmt.run(checkoutTime, reservationId);
    res.status(200).json({ message: 'Checkout successful.' });
  } catch (error) {
    console.error("Error during checkout:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Admin Login
app.post('/admin/login', (req, res) => {
  const { name, password } = req.body;

  // Input validation
  if (typeof name !== 'string' || 
    typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid name or password.' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM Admin WHERE name = ? AND password = ?');
    const admin = stmt.get(name, password);

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = generateAccessToken(admin);

    res.status(200).json({ message: 'Login successful', adminId: admin.adminId, token });
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Admin auth endpoint
app.get('/admin/auth', authenticateToken, (req, res) => {
  res.status(200).json({ 
    message: 'Admin authenticated', 
    adminId: req.user.name 
  });
});

// Get all employees with pagination
// GET /employees?page=1&pageSize=10
app.get('/employees', authenticateToken, (req, res) => {
  // Parse pagination query parameters
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
app.get('/employees/:userId', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  // Input validation
  if (isNaN(userId) 
    || !Number.isInteger(userId)) {
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
app.put('/employees/:userId/verify', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  // Input validation
  if (isNaN(userId) 
    || !Number.isInteger(userId)) {
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
app.put('/employees/:userId/team', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const { teamId } = req.body;

  // Input validation
  if (isNaN(userId) 
    || !Number.isInteger(userId) 
    || isNaN(teamId) 
    || !Number.isInteger(teamId)) {
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

// Get all teams with pagination
// GET /teams?page=1&pageSize=10
app.get('/teams', authenticateToken, (req, res) => {
  // Parse pagination query parameters
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
app.get('/teams/:teamId', authenticateToken, (req, res) => {
  const teamId = parseInt(req.params.teamId, 10);

  // Input validation
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
app.post('/teams', authenticateToken, (req, res) => {
  const { name } = req.body;

  // Input validation
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
app.put('/teams/:teamId', authenticateToken, (req, res) => {
  const teamId = parseInt(req.params.teamId, 10);
  const { name } = req.body;

  // Input validation
  if (isNaN(teamId) 
    || !Number.isInteger(teamId) 
    || typeof name !== 'string' 
    || name.trim() === '') {
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
app.delete('/teams/:teamId', authenticateToken, (req, res) => {
  const teamId = parseInt(req.params.teamId, 10);

  // Input validation
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

// Get all cars with pagination
// GET /cars?page=1&pageSize=10
app.get('/cars', authenticateToken, (req, res) => {
  // Parse pagination query parameters
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  if (page < 1 || pageSize < 1) {
    return res.status(400).json({ error: 'Invalid page or pageSize. Both must be positive integers.' });
  }
  const offset = (page - 1) * pageSize;

  try {
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM Car');
    const total = totalStmt.get().count;

    const stmt = db.prepare('SELECT * FROM Car LIMIT ? OFFSET ?');
    const cars = stmt.all(pageSize, offset);

    res.status(200).json({
      data: cars,
      total,
      page,
      pageSize,
      maxPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error("Error fetching cars:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get car by ID
app.get('/cars/:carId', authenticateToken, (req, res) => {
  const carId = parseInt(req.params.carId, 10);

  // Input validation
  if (isNaN(carId) || !Number.isInteger(carId)) {
    return res.status(400).json({ error: 'Invalid carId. It must be an integer.' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM Car WHERE carId = ?');
    const car = stmt.get(carId);

    if (!car) {
      return res.status(404).json({ error: 'Car not found.' });
    }

    res.status(200).json(car);
  } catch (error) {
    console.error("Error fetching car:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new car
app.post('/cars', authenticateToken, (req, res) => {
  const { plateNumber, teamId } = req.body;

  // Input validation
  if (typeof plateNumber !== 'string' 
      || plateNumber.trim() === '' 
      || typeof teamId !== 'number' 
      || !Number.isInteger(teamId)) {
    return res.status(400).json({ error: 'Invalid plateNumber or teamId.' });
  }

  try {
    const stmt = db.prepare('INSERT INTO Car (plateNumber, teamId) VALUES (?, ?)');
    const result = stmt.run(plateNumber, teamId);
    res.status(201).json({ carId: result.lastInsertRowid, plateNumber, teamId });
  } catch (error) {
    console.error("Error creating car:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a car's plate number and team
// Yes, "and", even if the team is not changed
// The data will be updated even though it does nothing
app.put('/cars/:carId', authenticateToken, (req, res) => {
  const carId = parseInt(req.params.carId, 10);
  const { plateNumber, teamId } = req.body;

  // Input validation
  if (isNaN(carId) 
    || !Number.isInteger(carId) 
    || typeof plateNumber !== 'string' 
    || plateNumber.trim() === '' 
    || typeof teamId !== 'number' 
    || !Number.isInteger(teamId)) {
    return res.status(400).json({ error: 'Invalid carId, plateNumber, or teamId.' });
  }

  try {
    const stmt = db.prepare('UPDATE Car SET plateNumber = ?, teamId = ? WHERE carId = ?');
    const result = stmt.run(plateNumber, teamId, carId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Car not found.' });
    }

    res.status(200).json({ message: 'Car updated successfully.' });
  } catch (error) {
    console.error("Error updating car:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a car
app.delete('/cars/:carId', authenticateToken, (req, res) => {
  const carId = parseInt(req.params.carId, 10);

  // Input validation
  if (isNaN(carId) || !Number.isInteger(carId)) {
    return res.status(400).json({ error: 'Invalid carId. It must be an integer.' });
  }

  try {
    const stmt = db.prepare('DELETE FROM Car WHERE carId = ?');
    const result = stmt.run(carId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Car not found.' });
    }

    res.status(200).json({ message: 'Car deleted successfully.' });
  } catch (error) {
    console.error("Error deleting car:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all reservations with pagination
// GET /reservations?page=1&pageSize=10
app.get('/reservations', authenticateToken, (req, res) => {
  // Parse pagination query parameters
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  if (page < 1 || pageSize < 1) {
    return res.status(400).json({ error: 'Invalid page or pageSize. Both must be positive integers.' });
  }
  const offset = (page - 1) * pageSize;

  try {
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM Reservation');
    const total = totalStmt.get().count;

    const stmt = db.prepare('SELECT * FROM Reservation LIMIT ? OFFSET ?');
    const reservations = stmt.all(pageSize, offset);

    res.status(200).json({
      data: reservations,
      total,
      page,
      pageSize,
      maxPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get reservation by ID
app.get('/reservations/:reservationId', authenticateToken, (req, res) => {
  const reservationId = parseInt(req.params.reservationId, 10);

  // Input validation
  if (isNaN(reservationId) || !Number.isInteger(reservationId)) {
    return res.status(400).json({ error: 'Invalid reservationId. It must be an integer.' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM Reservation WHERE reservationId = ?');
    const reservation = stmt.get(reservationId);

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    res.status(200).json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});