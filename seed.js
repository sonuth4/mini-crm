const db = require('./db');

const { count } = db.prepare('SELECT COUNT(*) AS count FROM leads').get();
if (count > 0) {
  console.log('Database already has leads, nothing added.');
  process.exit(0);
}

const insert = db.prepare(
  'INSERT INTO leads (name, email, phone, business, status) VALUES (?, ?, ?, ?, ?)'
);
[
  ['Aarav Sharma', 'aarav@sharmatextiles.in', '+91 98765 43210', 'Sharma Textiles', 'New'],
  ['Maya Thapa', 'maya@himalayacafe.com', '+977 9801234567', 'Himalaya Café', 'Contacted'],
  ['Rohan Mehta', 'rohan@mehtaprints.in', '+91 91234 56789', 'Mehta Prints', 'Converted'],
  ['Sita Rai', 'sita@raibakery.com', '+977 9812345678', 'Rai Bakery', 'New'],
  ['Daniel Brooks', 'daniel@brooksfitness.com', '+1 415 555 0142', 'Brooks Fitness', 'Contacted'],
].forEach((row) => insert.run(...row));

console.log('Added 5 sample leads.');
