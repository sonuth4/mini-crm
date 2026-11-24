// Opens the SQLite database and makes sure the "leads" table exists.
// Uses the SQLite that is built into Node.js (node:sqlite), so there is nothing to compile.
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'crm.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT NOT NULL,
    business   TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'New'
               CHECK (status IN ('New', 'Contacted', 'Converted')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

module.exports = db;
