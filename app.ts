import 'dotenv/config';

import express, { Application } from 'express';

import { initDbStatement } from './utils/initiateDatabase.js';
import { recoverSystem } from './services/systemRecovery.js';
import cors from 'cors';

import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import employeeRoutes from './routes/employee.js';
import teamRoutes from './routes/team.js';
import carRoutes from './routes/car.js';
import reservationRoutes from './routes/reservation.js';
import lineRoutes from './routes/line.js';

import requestLogger from './middlewares/requestLogger.js';
import errorLogger from './middlewares/errorLogger.js';

import fs from 'fs';

const app: Application = express();

// Load SSL certificate
const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert'),
};

// Create database tables if they do not exist
initDbStatement();

// If the system has no admin, trigger system recovery.
recoverSystem();

// Middleware to parse JSON
app.use(express.json());

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

app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/line', lineRoutes);

// Serve static files from the frontend build directory
app.use(express.static('frontend/dist'));

const frontendRoutes = [
  '/',
  '/verify',
  '/login',
  '/register',
  '/dashboard',
  '/admin',
  '/admin/dashboard',
  '/checkin',
  '/checkin/success',
  '/checkout',
  '/checkout/success',
  '/menu',
  '/line/access',
  '/line/callback'
];

frontendRoutes.forEach(route => {
  app.get(route, (req, res) => {
    res.sendFile(process.cwd() + '/frontend/dist/index.html');
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).send("OK");
})

export default app;