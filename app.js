import 'dotenv/config';

import express from 'express';
import Database from 'better-sqlite3';
import { initDbStatement } from './db_init.js';
import cors from 'cors';

const app = express();
const port = 3000;
const db = new Database(process.env.DATABASE_NAME || 'database.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

// Create database tables if they do not exist
try {
  initDbStatement(db);
} catch (error) {
  console.error("Error initializing database:", error);
}

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

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
  console.log(`Example app listening on port ${port}`);
});