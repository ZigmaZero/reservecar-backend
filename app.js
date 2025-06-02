import express from 'express'
import Database from 'better-sqlite3'

const app = express()
const port = 3000
const db = new Database('database.db', { verbose: console.log })

// Create database tables if they do not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS Employee (
    userId INTEGER PRIMARY KEY,
    lineId TEXT NOT NULL,
    name TEXT NOT NULL,
    verified INTEGER NOT NULL,
    teamId INTEGER,
    FOREIGN KEY (teamId) REFERENCES Team(teamId)
  );

  CREATE TABLE IF NOT EXISTS Team (
    teamId INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Car (
    carId INTEGER PRIMARY KEY,
    plateNumber TEXT NOT NULL,
    teamId INTEGER NOT NULL,
    FOREIGN KEY (teamId) REFERENCES Team(teamId)
  );

  CREATE TABLE IF NOT EXISTS Admin (
    adminId INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Reservation (
    reservationId INTEGER PRIMARY KEY,
    userId INTEGER NOT NULL,
    carId INTEGER NOT NULL,
    checkinTime TEXT NOT NULL,
    checkoutTime TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES Employee(userId),
    FOREIGN KEY (carId) REFERENCES Car(carId)
  );
`);

console.log('Tables confirmed to exist');

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})