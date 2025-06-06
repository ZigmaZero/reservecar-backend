import logger from "../logger.js";
import db from '../db.js';
import { exit } from "process";

export function initDbStatement() {
    try {
        db.exec(`
        CREATE TABLE IF NOT EXISTS Employee (
            userId INTEGER PRIMARY KEY AUTOINCREMENT,
            lineId TEXT,
            name TEXT NOT NULL,
            verified INTEGER NOT NULL,
            teamId INTEGER,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            deletedAt TEXT,
            FOREIGN KEY (teamId) REFERENCES Team(teamId)
        );

        CREATE TABLE IF NOT EXISTS Team (
            teamId INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            deletedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS Car (
            carId INTEGER PRIMARY KEY AUTOINCREMENT,
            plateNumber TEXT NOT NULL,
            teamId INTEGER,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            deletedAt TEXT,
            FOREIGN KEY (teamId) REFERENCES Team(teamId)
        );

        CREATE TABLE IF NOT EXISTS Admin (
            adminId INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            password TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            deletedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS Reservation (
            reservationId INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            carId INTEGER NOT NULL,
            checkinTime TEXT NOT NULL,
            checkoutTime TEXT,
            FOREIGN KEY (userId) REFERENCES Employee(userId),
            FOREIGN KEY (carId) REFERENCES Car(carId)
        );

        CREATE TABLE IF NOT EXISTS LineLoginState (
            state TEXT UNIQUE NOT NULL,
            createdAt TEXT NOT NULL
        );

        `);
        logger.info('Database tables initialized successfully.');
    }
    catch (error) {
        logger.error("Error initializing database:", error);
        exit(1);
    }


}