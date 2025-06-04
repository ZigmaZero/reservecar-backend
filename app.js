import 'dotenv/config';

import express from 'express';
import db from './db.js';
import { initDbStatement } from './db_init.js';
import cors from 'cors';

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
app.use('/admin', adminRoutes);
app.use('/employees', employeeRoutes);
app.use('/teams', teamRoutes);
app.use('/cars', carRoutes);
app.use('/reservations', reservationRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});