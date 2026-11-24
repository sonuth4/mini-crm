# Sonu's CRM (Mini CRM Dashboard)

**Live link:** https://mini-crm-kiku.onrender.com
**GitHub:** https://github.com/sonuth4/mini-crm

## What I built
A small website to keep track of leads, which are people who send enquiries to a business. On the dashboard I can see the total number of leads, how many are new, and how many are converted. I can add, edit and delete leads. Each lead has a name, email, phone number, business name and status. I can also search by name or email and filter by status (New, Contacted, Converted). Everything is saved in a database, so it stays after a refresh.

Other things I added: a loading message, a message when there are no leads, error messages, form checks (like a valid email), and a design that works on phones.

## Technologies I used
- HTML, CSS and JavaScript for the page. I used plain JavaScript because it is simple and I can explain it.
- Node.js with Express for the backend and the API.
- SQLite for the database. It is built into Node.js and saves everything in one file, so I did not need to set up any account.

## How to run it
1. Install Node.js (version 22.5 or newer).
2. Open the project folder in a terminal and run `npm install`.
3. Optional: run `npm run seed` to add 5 sample leads.
4. Run `npm start`.
5. Open http://localhost:3000

## Database setup
There is nothing to set up by hand. When the server starts, `db.js` creates a `data` folder with a file called `crm.db` and makes the `leads` table if it does not exist.

The table looks like this:

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

`seed.js` is an optional file that adds 5 sample leads so the dashboard is not empty while testing. It only runs when I use `npm run seed`, and it does nothing if the database already has leads. The website works without it.

## What each file does
- `server.js`: the API routes (add, get, update, delete) and the data checks
- `db.js`: opens the database and creates the table
- `seed.js`: adds the sample leads
- `public/index.html`, `public/style.css`, `public/app.js`: the page, the design and the logic

## API routes
- GET /api/stats gives the totals
- GET /api/leads?search=&status= gives the list of leads
- POST /api/leads adds a lead
- PUT /api/leads/:id edits a lead
- PATCH /api/leads/:id/status changes only the status
- DELETE /api/leads/:id deletes a lead

## A problem I faced
When I first ran `npm install`, it failed with an error about Python and build tools. The database package I was using did not work with my version of Node. I fixed it by switching to the SQLite that is already built into Node, and then it installed fine.

## Note about the live link
The live site is on a free plan. It can take about a minute to wake up on the first visit, and the database file may reset when the server restarts, so the leads may disappear. If the dashboard looks empty, just add a lead with the Add lead button.