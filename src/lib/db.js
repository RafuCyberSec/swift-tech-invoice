import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL;
const DB_DIR = isVercel 
  ? path.join('/tmp', 'database') 
  : path.join(process.cwd(), 'database');
const DB_PATH = path.join(DB_DIR, 'invoices.db');

let _db = null;
let _SQL = null;

/**
 * Get or create the database connection (singleton)
 * sql.js is a pure-JS SQLite — no native compilation needed
 */
export async function getDb() {
  if (_db) return _db;

  // Ensure the database directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!_SQL) {
    _SQL = await initSqlJs();
  }

  // Load existing database or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new _SQL.Database(fileBuffer);
  } else {
    _db = new _SQL.Database();
  }

  _db.run('PRAGMA journal_mode = WAL');
  _db.run('PRAGMA foreign_keys = ON');

  // Initialize schema
  initializeSchema(_db);

  // Persist
  saveDb();

  return _db;
}

function saveDb() {
  if (!_db) return;
  const data = _db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initializeSchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      company_name TEXT DEFAULT 'Swift Tech & Games',
      website TEXT DEFAULT 'swifttechngames.com',
      email TEXT DEFAULT 'info@swifttechngames.com',
      phone TEXT DEFAULT '+92 328 0445543',
      brand_color TEXT DEFAULT '#CC19F4',
      currency_symbol TEXT DEFAULT '₨',
      currency_name TEXT DEFAULT 'PKR',
      logo_path TEXT DEFAULT '/logo.svg',
      invoice_prefix TEXT DEFAULT 'ACC-SINV',
      default_terms TEXT DEFAULT 'Warranty void if burnt or broken. Original box, stickers, accessories, manuals and invoice are required for warranty.
Warranty claims can take between 20 to 60 days.',
      next_invoice_number INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_name TEXT,
      customer_address TEXT,
      customer_phone TEXT,
      invoice_date TEXT,
      due_date TEXT,
      line_items TEXT,
      shipping_charges REAL DEFAULT 0,
      shipping_free INTEGER DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      notes TEXT,
      terms TEXT,
      status TEXT DEFAULT 'draft',
      created_by INTEGER NOT NULL REFERENCES users(id),
      updated_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create indexes
  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by)');
    db.run('CREATE INDEX IF NOT EXISTS idx_invoices_customer_name ON invoices(customer_name)');
    db.run('CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number)');
  } catch {
    // Indexes may already exist
  }

  // Seed settings row if it doesn't exist
  const result = db.exec('SELECT id FROM settings WHERE id = 1');
  if (result.length === 0 || result[0].values.length === 0) {
    db.run('INSERT OR IGNORE INTO settings (id) VALUES (1)');
    saveDb();
  }
}

// ============================================================
// Helper to convert sql.js result to object
// ============================================================
function resultToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

function resultToObject(result) {
  const objects = resultToObjects(result);
  return objects.length > 0 ? objects[0] : null;
}

// ============================================================
// User Queries
// ============================================================

export async function getUserByEmail(email) {
  const db = await getDb();
  const result = db.exec('SELECT * FROM users WHERE email = ?', [email]);
  return resultToObject(result);
}

export async function getUserById(id) {
  const db = await getDb();
  const result = db.exec(
    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
    [id]
  );
  return resultToObject(result);
}

export async function getAllUsers() {
  const db = await getDb();
  const result = db.exec(
    'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC'
  );
  return resultToObjects(result);
}

export async function createUser(name, email, passwordHash, role = 'staff') {
  const db = await getDb();
  db.run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  saveDb();
  // sql.js: get the last inserted row id
  const result = db.exec('SELECT MAX(id) as id FROM users');
  return result[0]?.values[0]?.[0] || 1;
}

export async function updateUser(id, data) {
  const db = await getDb();
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDb();
}

export async function deleteUser(id) {
  const db = await getDb();
  db.run('DELETE FROM users WHERE id = ?', [id]);
  saveDb();
}

export async function getUserCount() {
  const db = await getDb();
  const result = db.exec('SELECT COUNT(*) as count FROM users');
  return result[0].values[0][0];
}

// ============================================================
// Settings Queries
// ============================================================

export async function getSettings() {
  const db = await getDb();
  const result = db.exec('SELECT * FROM settings WHERE id = 1');
  return resultToObject(result);
}

export async function updateSettings(data) {
  const db = await getDb();
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (fields.length === 0) return;
  db.run(`UPDATE settings SET ${fields.join(', ')} WHERE id = 1`, values);
  saveDb();
}

// ============================================================
// Invoice Queries
// ============================================================

export async function getInvoiceById(id) {
  const db = await getDb();
  const result = db.exec(`
    SELECT i.*, u.name as creator_name
    FROM invoices i
    LEFT JOIN users u ON i.created_by = u.id
    WHERE i.id = ?
  `, [id]);
  const invoice = resultToObject(result);
  if (invoice && invoice.line_items) {
    try {
      invoice.line_items = JSON.parse(invoice.line_items);
    } catch {
      invoice.line_items = [];
    }
  }
  return invoice;
}

export async function getAllInvoices(search = '') {
  const db = await getDb();
  let query = `
    SELECT i.*, u.name as creator_name
    FROM invoices i
    LEFT JOIN users u ON i.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (i.customer_name LIKE ? OR i.invoice_number LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY i.created_at DESC`;

  const result = db.exec(query, params);
  const invoices = resultToObjects(result);
  return invoices.map(inv => ({
    ...inv,
    line_items: inv.line_items ? (() => { try { return JSON.parse(inv.line_items); } catch { return []; } })() : [],
  }));
}

export async function createInvoice(data) {
  const db = await getDb();
  db.run(`
    INSERT INTO invoices (
      invoice_number, customer_name, customer_address, customer_phone,
      invoice_date, due_date, line_items, shipping_charges, shipping_free,
      discount_amount, notes, terms, status, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.invoice_number,
    data.customer_name || '',
    data.customer_address || '',
    data.customer_phone || '',
    data.invoice_date || '',
    data.due_date || '',
    JSON.stringify(data.line_items || []),
    data.shipping_charges || 0,
    data.shipping_free ? 1 : 0,
    data.discount_amount || 0,
    data.notes || '',
    data.terms || '',
    data.status || 'draft',
    data.created_by,
    data.created_by,
  ]);
  saveDb();
  const result = db.exec('SELECT MAX(id) as id FROM invoices');
  return result[0]?.values[0]?.[0] || 1;
}

export async function updateInvoice(id, data, userId) {
  const db = await getDb();
  const fields = [];
  const values = [];
  const allowedFields = [
    'customer_name', 'customer_address', 'customer_phone',
    'invoice_date', 'due_date', 'shipping_charges', 'shipping_free',
    'discount_amount', 'notes', 'terms', 'status'
  ];

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === 'shipping_free' ? (data[key] ? 1 : 0) : data[key]);
    }
  }

  if (data.line_items !== undefined) {
    fields.push('line_items = ?');
    values.push(JSON.stringify(data.line_items));
  }

  fields.push('updated_by = ?');
  values.push(userId);
  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.run(`UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDb();
}

export async function deleteInvoice(id) {
  const db = await getDb();
  db.run('DELETE FROM invoices WHERE id = ?', [id]);
  saveDb();
}

export async function getNextInvoiceNumber() {
  const db = await getDb();
  const result = db.exec('SELECT invoice_prefix, next_invoice_number FROM settings WHERE id = 1');
  const settings = resultToObject(result);
  const year = new Date().getFullYear();
  const num = settings?.next_invoice_number || 1;
  const prefix = settings?.invoice_prefix || 'ACC-SINV';
  const paddedNum = String(num).padStart(5, '0');
  const invoiceNumber = `${prefix}-${year}-${paddedNum}`;

  // Increment the counter
  db.run('UPDATE settings SET next_invoice_number = ? WHERE id = 1', [num + 1]);
  saveDb();

  return invoiceNumber;
}
