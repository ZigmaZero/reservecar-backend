import 'dotenv/config';

import express from 'express';
import { initDbStatement } from './services/db_init.js';
import { recoverSystem } from './services/systemRecovery.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import employeeRoutes from './routes/employee.js';
import teamRoutes from './routes/team.js';
import carRoutes from './routes/car.js';
import reservationRoutes from './routes/reservation.js';

import requestLogger from './middlewares/requestLogger.js';
import errorLogger from './middlewares/errorLogger.js';


const app = express();
const port = 3000;

// Create database tables if they do not exist
initDbStatement();

// If the system has no admin, trigger system recovery.
recoverSystem();

// Middleware to parse JSON
app.use(express.json());

// Middleware to get cookies
app.use(cookieParser());

// Middleware to log requests
app.use(requestLogger);

// Middleware to log errors
app.use(errorLogger);

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