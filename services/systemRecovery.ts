import Database from 'better-sqlite3';
import db from '../db.js';
import { Admin } from '../interfaces/internalTypes.js';
import logger from '../logger.js';
import { exit } from 'process';

export function recoverSystem(): void {
    try {
        // Check if the Admin table is empty
        const stmt = db.prepare<[], Admin>('SELECT * FROM Admin LIMIT 1');
        const admin = stmt.get();
    
        if (!admin) {
            logger.warn('No admin found in the system. Initiating recovery process.');
            // If no admin exists, create a default admin
            const createAdminStmt = db.prepare<[string, string, string, string], Admin>('INSERT INTO Admin (name, password, createdAt, updatedAt) VALUES (?, ?, ?, ?)');
            // Generate a default admin with randomized password
            const password = Math.random().toString(36).slice(-8); // Random 8-character password
            logger.info(`Creating default admin with username 'admin' and password '${password}'`);
            // TODO: Hash here
            createAdminStmt.run('admin', password, new Date().toISOString(), new Date().toISOString()); // Admin credentials
        
            logger.info('System recovery complete: Default admin created.');
        } else {
            logger.info('System recovery not needed: Admin already exists.');
        }
    } catch (error) {
        logger.error('Error during system recovery:', error);
        exit(1);
    }
}