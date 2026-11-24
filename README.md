# Mini CRM Dashboard

A small website for tracking business enquiries (leads). You can add, edit and delete leads, search them, filter by status, and see the totals at the top. Leads are saved in a database, so they are still there after a refresh.

**Live link:** _add your deployed URL here_
**Repository:** _add your GitHub URL here_

## Features

- Overview: total leads, new leads, converted leads
- Add, edit and delete leads (name, email, phone, business name, status)
- Change a lead's status straight from the table (New, Contacted, Converted)
- Search by name or email, filter by status
- Saved in a SQLite database through a backend API
- Loading message, empty-state messages, clear error messages
- Form validation in the browser and again on the server (the server never trusts the browser)
- Works on phones and desktops

## Tech stack and why

| Part | Choice | Why |
|---|---|---|
| Frontend | HTML, CSS, plain JavaScript | No build step. Easy to read and explain. |
| Backend | Node.js + Express | Small and popular. Each API route is a few lines. |
| Database | SQLite (built into Node.js as `node:sqlite`) | One file, no account or extra install, and data survives restarts. |

## Run it on your computer

You need [Node.js](https://nodejs.org) **22.5 or newer** (the LTS version is fine). Node prints an "ExperimentalWarning: SQLite" message when it starts; this is harmless.

```bash
npm install
npm run seed     # optional: adds 5 sample leads
npm start
```

Open http://localhost:3000

## Database setup

There is nothing to set up by hand. When the server starts, `db.js` creates the file `data/crm.db` and the `leads` table if they do not exist yet.

The table it creates:

```sql
CREATE TABLE IF NOT EXISTS leads (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT NOT NULL,
  business   TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'New'
             CHECK (status IN ('New', 'Contacted', 'Converted')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

To store the file somewhere else, set the `DB_PATH` environment variable.

## API

| Method | Route | What it does |
|---|---|---|
| GET | `/api/stats` | Returns `{ total, new, converted }` |
| GET | `/api/leads?search=&status=` | Lists leads, optionally searched or filtered |
| POST | `/api/leads` | Adds a lead |
| PUT | `/api/leads/:id` | Edits a lead |
| PATCH | `/api/leads/:id/status` | Changes only the status |
| DELETE | `/api/leads/:id` | Deletes a lead |

Invalid data returns status `400` with `{ "error": "...", "fields": { "email": "..." } }`. A missing lead returns `404`.

## Project structure

```
server.js        API routes and validation
db.js            Opens the database and creates the table
seed.js          Optional sample data
public/
  index.html     Page layout and the add/edit form
  style.css      Styling (responsive)
  app.js         Fetches data, draws the table, handles the form
```

## Deploying (for the live link)

1. Push this folder to a GitHub repository.
2. On [Render](https://render.com), create a **Web Service** from the repo.
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment variable: `NODE_VERSION` = `22` (the app needs Node 22.5 or newer)
3. Copy the URL Render gives you into the top of this README.

**Important:** On free hosting plans the disk is temporary, so a SQLite file can be reset when the service restarts or redeploys. For permanent storage, attach a persistent disk (for example mounted at `/var/data`) and set `DB_PATH=/var/data/crm.db`, or move the data to a hosted database such as Supabase.

## Challenges I faced

_Write this part in your own words. Ideas: how you validated the email and phone number, stopping old search results from replacing newer ones while typing, making the table readable on a phone, or deciding where to host the database._
