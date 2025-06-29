import Database from 'better-sqlite3';
import logger from './logger.js';

const db = new Database(
  (process.env.NODE_ENV === 'test') 
  ? 'database/test.db' 
  : 'database/database.db',
  { verbose: (msg) => logger.info(msg) }
);
db.pragma('journal_mode = WAL');

export default db;