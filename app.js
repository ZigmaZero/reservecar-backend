import 'dotenv/config';

import express from 'express';
import db from './db.js';
import { initDbStatement } from './db_init.js';
import cors from 'cors';
import jwt from 'jsonwebtoken';

import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import employeeRoutes from './routes/employee.js';
import teamRoutes from './routes/team.js';
import carRoutes from './routes/car.js';
import reservationRoutes from './routes/reservation.js';

const app = express();
const port = 3000;

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

app.use('/user', userRoutes);
app.use('/admin', adminRoutes(authenticateToken));
app.use('/employees', employeeRoutes(authenticateToken));
app.use('/teams', teamRoutes(authenticateToken));
app.use('/cars', carRoutes(authenticateToken));
app.use('/reservations', reservationRoutes(authenticateToken));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});