
const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const STATUSES = ['New', 'Contacted', 'Converted'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLead(body = {}) {
  const lead = {
    name: String(body.name ?? '').trim(),
    email: String(body.email ?? '').trim(),
    phone: String(body.phone ?? '').trim(),
    business: String(body.business ?? '').trim(),
    status: String(body.status ?? 'New').trim(),
  };
  const errors = {};

  if (!lead.name) errors.name = 'Enter the lead’s name.';
  if (!EMAIL_RE.test(lead.email)) errors.email = 'Enter a valid email, like name@example.com.';

  const digits = lead.phone.replace(/\D/g, '');
  if (!/^[+\d\s\-()]+$/.test(lead.phone) || digits.length < 7 || digits.length > 15) {
    errors.phone = 'Enter a phone number with 7 to 15 digits.';
  }

  if (!lead.business) errors.business = 'Enter the business name.';
  if (!STATUSES.includes(lead.status)) errors.status = 'Choose New, Contacted or Converted.';

  return { lead, errors, ok: Object.keys(errors).length === 0 };
}

function sendInvalid(res, errors) {
  return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
}


app.get('/api/stats', (req, res) => {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(status = 'New'), 0) AS new,
              COALESCE(SUM(status = 'Converted'), 0) AS converted
       FROM leads`
    )
    .get();
  res.json(row);
});


app.get('/api/leads', (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const status = String(req.query.status ?? '').trim();

  const leads = db
    .prepare(
      `SELECT * FROM leads
       WHERE (@q = '' OR name LIKE @like OR email LIKE @like)
         AND (@status = '' OR status = @status)
       ORDER BY id DESC`
    )
    .all({ q: search, like: `%${search}%`, status });

  res.json(leads);
});


app.post('/api/leads', (req, res) => {
  const { lead, errors, ok } = validateLead(req.body);
  if (!ok) return sendInvalid(res, errors);

  const result = db
    .prepare(
      `INSERT INTO leads (name, email, phone, business, status)
       VALUES (@name, @email, @phone, @business, @status)`
    )
    .run(lead);

  const created = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});


app.put('/api/leads/:id', (req, res) => {
  const { lead, errors, ok } = validateLead(req.body);
  if (!ok) return sendInvalid(res, errors);

  const result = db
    .prepare(
      `UPDATE leads
       SET name = @name, email = @email, phone = @phone, business = @business, status = @status
       WHERE id = @id`
    )
    .run({ ...lead, id: req.params.id });

  if (result.changes === 0) return res.status(404).json({ error: 'That lead no longer exists.' });
  res.json(db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id));
});


app.patch('/api/leads/:id/status', (req, res) => {
  const status = String(req.body?.status ?? '');
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Status must be New, Contacted or Converted.' });
  }

  const result = db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'That lead no longer exists.' });
  res.json(db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id));
});


app.delete('/api/leads/:id', (req, res) => {
  const result = db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'That lead no longer exists.' });
  res.status(204).end();
});


app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found.' }));


app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  let message = 'Something went wrong on the server.';
  if (err.type === 'entity.parse.failed') message = 'The request body was not valid JSON.';
  else if (status !== 500) message = err.message;
  res.status(status).json({ error: message });
});

app.listen(PORT, () => console.log(`Mini CRM running at http://localhost:${PORT}`));
