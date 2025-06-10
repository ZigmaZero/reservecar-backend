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

import fs from 'fs';
import ngrok from 'ngrok';
import listEndpoints from 'express-list-endpoints';
import logger from './logger.js';

const app = express();
const port = 3000;

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

app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/reservations', reservationRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the ReserveCar API!');
});

logger.info("Pass routes")

console.log("Registered routes:");
listEndpoints(app).forEach((route) => {
  console.log(`${route.methods.join(', ')} ${route.path}`);
});


logger.info("Pass list-endpoints")

// Serve static files from the frontend build directory
app.use(express.static('frontend/dist'));

logger.info("Pass static files")

const frontendRoutes = [
  '/verify',
  '/login',
  '/register',
  '/dashboard',
  '/admin',
  '/admin/dashboard',
  '/checkin',
  '/checkout',
  '/menu',
];

frontendRoutes.forEach(route => {
  app.get(route, (req, res) => {
    res.sendFile(process.cwd() + '/frontend/dist/index.html');
  });
});

logger.info("Pass frontend routes")

app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
});