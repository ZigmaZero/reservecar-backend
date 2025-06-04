import Database from 'better-sqlite3';

const db = new Database(process.env.DATABASE_NAME || 'database.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

export default db;