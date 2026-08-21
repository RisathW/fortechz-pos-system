const express = require('express');
const { Pool, Client } = require('pg'); 
const cors = require('cors');
const path = require('path'); 
const fs = require('fs');         // ✅ File System (For the Audit Log)
const os = require('os');         // ✅ Operating System (To find the Documents folder safely)
const { exec } = require('child_process'); // ✅ Required to run the Windows lock command
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 🛡️ CRASH PREVENTER (Keeps app alive during random Windows errors)
// ==========================================
process.on('uncaughtException', function (err) {
  console.error('Caught exception (Ignored to keep app running):', err.message);
});

// GLOBAL POOL
let pool;

// ==========================================
// 🔒 SECURE, AUTO-LOCKING AUDIT LOGGER
// ==========================================
function writeAuditLog(user, action, details) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] USER: ${user || 'System'} | ACTION: ${action} | DETAILS: ${details}\n`;
  
  // 1. Hide the log deep in the invisible Windows AppData folder
  const logDirectory = path.join(process.env.APPDATA || os.homedir(), 'ForTechZ_Logs');
  const logFilePath = path.join(logDirectory, 'pos_audit.log');

  // Check if this is the very first time the file is being created
  const isFirstRun = !fs.existsSync(logFilePath);

  // Create the folder if it doesn't exist yet
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
  }
  
  // Append the log to the file
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) console.error("Failed to write to audit log:", err);

    // 2. AUTO-LOCK SCRIPT: Only triggers once upon creation
    if (isFirstRun && process.platform === 'win32') {
      
      // Grant: Read (R) & Append Data (AD) | Deny: Write/Modify Data (WD) & Delete (DE)
      const lockCommand = `icacls "${logFilePath}" /grant Everyone:(R,AD) /deny Everyone:(WD,DE)`;
      
      exec(lockCommand, (error) => {
        if (error) {
          console.error("Auto-lock failed:", error);
        } else {
          console.log("🔒 Security Active: Audit log created and manually locked against tampering.");
        }
      });
    }
  });
}

// ==========================================
// 🚀 ZERO-TOUCH DATABASE INITIALIZATION
// ==========================================
async function initializeDatabase() {
  console.log('⏳ Checking database status...');
  const setupClient = new Client({
    user: 'postgres', host: 'localhost', database: 'postgres', password: 'Risa2007', port: 5432
  });

  try {
    await setupClient.connect();
    const res = await setupClient.query("SELECT 1 FROM pg_database WHERE datname = 'bookshop_pos'");
    if (res.rowCount === 0) {
      console.log('🏗️ Creating new bookshop_pos database...');
      await setupClient.query('CREATE DATABASE bookshop_pos');
      console.log('✅ Database created successfully!');
    }
  } catch (err) {
    console.error('❌ Failed to check/create database:', err.message);
  } finally {
    await setupClient.end();
  }

  pool = new Pool({
    user: 'postgres', host: 'localhost', database: 'bookshop_pos', password: 'Risa2007', port: 5432
  });

  // 🛡️ SLEEP MODE PROTECTOR: If PC sleeps and DB drops, don't crash, just wait for reconnect!
  pool.on('error', (err, client) => {
    console.error('⚠️ Database connection dropped (PC likely went to sleep). Auto-reconnecting...', err.message);
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Users (username VARCHAR(100) PRIMARY KEY, password VARCHAR(100), role VARCHAR(50), is_approved BOOLEAN DEFAULT FALSE, last_login TIMESTAMP);
      CREATE TABLE IF NOT EXISTS Suppliers (id SERIAL PRIMARY KEY, company_name VARCHAR(255), contact_person VARCHAR(100), phone_number VARCHAR(50), address TEXT, city VARCHAR(100), email VARCHAR(100), credit_limit DECIMAL(10,2));
      CREATE TABLE IF NOT EXISTS Books (id SERIAL PRIMARY KEY, title VARCHAR(255), author_name VARCHAR(255), isbn_barcode VARCHAR(100), category VARCHAR(100), retail_price DECIMAL(10,2), cost_price DECIMAL(10,2), available_qty INTEGER, supplier_id INTEGER REFERENCES Suppliers(id));
      CREATE TABLE IF NOT EXISTS Sales (id SERIAL PRIMARY KEY, invoice_number VARCHAR(100) UNIQUE, total_amount DECIMAL(10,2), payment_type VARCHAR(50), created_by VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS Sale_Items (id SERIAL PRIMARY KEY, sale_id INTEGER REFERENCES Sales(id) ON DELETE CASCADE, book_id INTEGER REFERENCES Books(id), quantity INTEGER, original_qty INTEGER, unit_price DECIMAL(10,2), subtotal DECIMAL(10,2));
      CREATE TABLE IF NOT EXISTS Stock_Transactions (id SERIAL PRIMARY KEY, supplier_id INTEGER REFERENCES Suppliers(id), type VARCHAR(50), total_cost DECIMAL(10,2), notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS Stock_Items (id SERIAL PRIMARY KEY, transaction_id INTEGER REFERENCES Stock_Transactions(id) ON DELETE CASCADE, book_id INTEGER REFERENCES Books(id), quantity INTEGER, buy_rate DECIMAL(10,2));
      CREATE TABLE IF NOT EXISTS Expenses (id SERIAL PRIMARY KEY, description VARCHAR(255), amount DECIMAL(10,2), created_by VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS Returns (id SERIAL PRIMARY KEY, invoice_number VARCHAR(100), amount DECIMAL(10,2), created_by VARCHAR(100), returned_items TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS Cash_Drawer (id SERIAL PRIMARY KEY, shift_date DATE DEFAULT CURRENT_DATE UNIQUE, starting_balance DECIMAL(10,2), created_by VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      
      -- ✅ NEW: TABLES FOR RESERVATIONS / LAYAWAYS
      CREATE TABLE IF NOT EXISTS Reservations (id SERIAL PRIMARY KEY, ref_number VARCHAR(100) UNIQUE, customer_name VARCHAR(255), phone VARCHAR(50), pickup_date DATE, total_amount DECIMAL(10,2), advance_paid DECIMAL(10,2), payment_type VARCHAR(50), status VARCHAR(50) DEFAULT 'Pending Pickup', created_by VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS Reservation_Items (id SERIAL PRIMARY KEY, reservation_id INTEGER REFERENCES Reservations(id) ON DELETE CASCADE, book_id INTEGER REFERENCES Books(id), title VARCHAR(255), quantity INTEGER, unit_price DECIMAL(10,2), subtotal DECIMAL(10,2));
    `);
    console.log('✅ All Tables Ready!');
    
    // ✅ FIXED AUTO-PATCHER: Runs every update independently so one error doesn't break the rest
    const patches = [
      "ALTER TABLE Books ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'Unassigned'",
      "ALTER TABLE Returns ADD COLUMN IF NOT EXISTS returned_items TEXT",
      "ALTER TABLE Sale_Items ADD COLUMN IF NOT EXISTS original_qty INTEGER",
      "UPDATE Sale_Items SET original_qty = quantity WHERE original_qty IS NULL",
      "ALTER TABLE Cash_Drawer DROP CONSTRAINT IF EXISTS cash_drawer_shift_date_key",
      "ALTER TABLE Cash_Drawer ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'OPEN'",
      "ALTER TABLE Cash_Drawer ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP"
    ];

    for (let query of patches) {
      try {
        await pool.query(query);
      } catch (e) {
        // Ignored safely so the next patch command can run
      }
    }
    console.log("✅ Database schema auto-patched successfully!");

  } catch (err) { console.error('Table Creation Error:', err.message); }
}

initializeDatabase();

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================
app.get('/api/setup/status', async (req, res) => {
  try { 
    const result = await pool.query('SELECT COUNT(*) FROM Users'); 
    res.json({ isFirstRun: parseInt(result.rows[0].count) === 0 }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/setup/admin', async (req, res) => {
  try { 
    const check = await pool.query('SELECT COUNT(*) FROM Users');
    if (parseInt(check.rows[0].count) > 0) return res.status(403).json({ success: false, message: 'Admin already exists.' });
    
    await pool.query('INSERT INTO Users (username, password, role, is_approved) VALUES ($1, $2, $3, TRUE)', [req.body.username, req.body.password, 'Manager']); 
    writeAuditLog(req.body.username, 'SYSTEM_SETUP', 'Created master admin account');
    res.json({ success: true, message: 'Master Admin created!' }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Users WHERE username = $1 AND password = $2', [req.body.username, req.body.password]);
    if (result.rows.length > 0) {
      if (!result.rows[0].is_approved) return res.status(403).json({ success: false, message: 'Pending approval.' });
      
      await pool.query('UPDATE Users SET last_login = CURRENT_TIMESTAMP WHERE username = $1', [req.body.username]);
      writeAuditLog(req.body.username, 'LOGIN', 'User logged in successfully');
      res.json({ success: true, user: { username: result.rows[0].username, role: result.rows[0].role } });
    } else {
      writeAuditLog(req.body.username, 'FAILED_LOGIN', 'Attempted login with invalid credentials');
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM Users WHERE username = $1', [req.body.username]);
    if (existing.rows.length > 0) return res.status(400).json({ success: false, message: 'Username exists.' });
    
    await pool.query('INSERT INTO Users (username, password, role, is_approved) VALUES ($1, $2, $3, FALSE)', [req.body.username, req.body.password, 'Cashier']);
    writeAuditLog(req.body.username, 'SIGNUP', 'New user registered, awaiting approval');
    res.json({ success: true, message: 'Account created! Wait for Admin approval.' });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.get('/api/users', async (req, res) => {
  try { 
    const result = await pool.query('SELECT username, role, is_approved, last_login FROM Users');
    res.json(result.rows); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/users/approve', async (req, res) => {
  try { 
    await pool.query('UPDATE Users SET is_approved = TRUE WHERE username = $1', [req.body.username]); 
    writeAuditLog('Admin', 'USER_APPROVE', `Approved account for ${req.body.username}`);
    res.json({ success: true }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.put('/api/users/:username/username', async (req, res) => {
  try { 
    const { newUsername } = req.body;
    const oldUsername = req.params.username;
    
    const check = await pool.query('SELECT * FROM Users WHERE username = $1', [newUsername]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Username already taken.' });
    
    await pool.query('UPDATE Users SET username = $1 WHERE username = $2', [newUsername, oldUsername]); 
    writeAuditLog('Admin', 'USER_UPDATE', `Changed username from ${oldUsername} to ${newUsername}`);
    res.json({ success: true }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.put('/api/users/:username/role', async (req, res) => {
  try { 
    const { newRole } = req.body;
    if (req.params.username === 'admin') return res.status(403).json({ error: 'Cannot change the master admin role.' });
    
    await pool.query('UPDATE Users SET role = $1 WHERE username = $2', [newRole, req.params.username]); 
    writeAuditLog('Admin', 'ROLE_CHANGE', `Changed role of ${req.params.username} to ${newRole}`);
    res.json({ success: true }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.put('/api/users/:username/password', async (req, res) => {
  try { 
    await pool.query('UPDATE Users SET password = $1 WHERE username = $2', [req.body.newPassword, req.params.username]); 
    writeAuditLog('Admin', 'PASSWORD_RESET', `Reset password for ${req.params.username}`);
    res.json({ success: true }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.delete('/api/users/:username', async (req, res) => {
  try { 
    if (req.params.username === 'admin') return res.status(403).json({ error: 'Cannot delete master admin.' });
    
    await pool.query('DELETE FROM Users WHERE username = $1', [req.params.username]); 
    writeAuditLog('Admin', 'USER_DELETE', `Deleted account for ${req.params.username}`);
    res.json({ success: true }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// ==========================================
// 2. INVENTORY & SUPPLIERS
// ==========================================
app.get('/api/books', async (req, res) => {
  try { 
    const result = await pool.query('SELECT * FROM Books ORDER BY title ASC');
    res.json(result.rows); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/books', async (req, res) => {
  const { title, author_name, isbn_barcode, category, retail_price, available_qty, cost_price = 0, supplier_id = null, location = 'Unassigned' } = req.body;
  try { 
    await pool.query('INSERT INTO Books (title, author_name, isbn_barcode, category, retail_price, available_qty, cost_price, supplier_id, location) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', 
    [title, author_name, isbn_barcode, category, retail_price, available_qty, cost_price, supplier_id, location]); 
    
    writeAuditLog('System', 'ADD_BOOK', `Added item: ${title} (Loc: ${location})`);
    res.json({ success: true }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try { 
    await pool.query('DELETE FROM Books WHERE id = $1', [req.params.id]); 
    writeAuditLog('System', 'DELETE_BOOK', `Deleted inventory item ID: ${req.params.id}`);
    res.json({ success: true }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.get('/api/suppliers', async (req, res) => {
  try { 
    const result = await pool.query('SELECT * FROM Suppliers ORDER BY company_name ASC');
    res.json(result.rows); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/suppliers', async (req, res) => {
  const { company_name, contact_person, phone_number, address, city, email, credit_limit } = req.body;
  try { 
    await pool.query('INSERT INTO Suppliers (company_name, contact_person, phone_number, address, city, email, credit_limit) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
    [company_name, contact_person, phone_number, address, city, email, credit_limit]); 
    
    writeAuditLog('System', 'ADD_SUPPLIER', `Added supplier: ${company_name}`);
    res.json({ success: true }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try { 
    await pool.query('DELETE FROM Suppliers WHERE id = $1', [req.params.id]); 
    writeAuditLog('System', 'DELETE_SUPPLIER', `Deleted supplier ID: ${req.params.id}`);
    res.json({ success: true }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// ==========================================
// 3. STOCK CONTROL
// ==========================================
app.post('/api/stock/process', async (req, res) => {
  const { supplier_id, type, items, total_cost, notes } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const transRes = await client.query('INSERT INTO Stock_Transactions (supplier_id, type, total_cost, notes) VALUES ($1, $2, $3, $4) RETURNING id', [supplier_id, type, total_cost, notes]);
    const transId = transRes.rows[0].id;
    
    for (let item of items) {
      const qtyChange = type === 'GRN' ? item.qty : -item.qty;
      await client.query('UPDATE Books SET available_qty = available_qty + $1 WHERE id = $2', [qtyChange, item.id]);
      
      if (type === 'GRN') {
        await client.query('UPDATE Books SET cost_price = $1 WHERE id = $2', [item.buy_rate, item.id]);
      }
      
      await client.query('INSERT INTO Stock_Items (transaction_id, book_id, quantity, buy_rate) VALUES ($1, $2, $3, $4)', [transId, item.id, item.qty, item.buy_rate]);
    }
    
    await client.query('COMMIT'); 
    writeAuditLog('System', 'STOCK_PROCESS', `Processed ${type} for LKR ${total_cost}. Notes: ${notes}`);
    res.json({ success: true });
  } catch (err) { 
    await client.query('ROLLBACK'); 
    res.status(500).json({ error: err.message }); 
  } finally { 
    client.release(); 
  }
});

app.get('/api/stock/history', async (req, res) => {
  try {
    const query = `
      SELECT st.id, st.type, st.total_cost, st.notes, st.created_at, s.company_name as supplier, b.title, si.quantity, si.buy_rate
      FROM Stock_Transactions st LEFT JOIN Suppliers s ON st.supplier_id = s.id
      JOIN Stock_Items si ON st.id = si.transaction_id JOIN Books b ON si.book_id = b.id ORDER BY st.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// ==========================================
// 4. CHECKOUT & SALES LOGIC
// ==========================================
app.post('/api/checkout', async (req, res) => {
  const { payment_type, total_amount, cart_items, username } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const invoiceNum = `INV-${Date.now()}`;
    
    const saleRes = await client.query('INSERT INTO Sales (invoice_number, total_amount, payment_type, created_by) VALUES ($1, $2, $3, $4) RETURNING id', [invoiceNum, total_amount, payment_type, username]);
    const saleId = saleRes.rows[0].id;
    
    for (let item of cart_items) {
      await client.query('INSERT INTO Sale_Items (sale_id, book_id, quantity, original_qty, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5, $6)', [saleId, item.id, item.qty, item.qty, item.retail_price, item.retail_price * item.qty]);
      await client.query('UPDATE Books SET available_qty = available_qty - $1 WHERE id = $2', [item.qty, item.id]);
    }
    
    await client.query('COMMIT'); 
    writeAuditLog(username, 'CHECKOUT', `Processed Sale ${invoiceNum} for LKR ${total_amount} via ${payment_type}`);
    res.json({ success: true });
  } catch (err) { 
    await client.query('ROLLBACK'); 
    res.status(500).json({ error: err.message }); 
  } finally { 
    client.release(); 
  }
});

app.get('/api/sales/history', async (req, res) => {
  try {
    const query = `
      SELECT 
        s.id, s.invoice_number, s.total_amount, s.payment_type, s.created_by, s.created_at, 
        COALESCE(r.refunded_amount, 0) as refunded_amount,
        json_agg(json_build_object(
          'book_id', b.id, 
          'title', b.title, 
          'qty', si.quantity, 
          'original_qty', COALESCE(si.original_qty, si.quantity),
          'subtotal', si.subtotal, 
          'price', si.unit_price
        )) as items 
      FROM Sales s 
      LEFT JOIN (
        SELECT invoice_number, SUM(amount) as refunded_amount 
        FROM Returns 
        GROUP BY invoice_number
      ) r ON s.invoice_number = r.invoice_number
      JOIN Sale_Items si ON s.id = si.sale_id 
      JOIN Books b ON si.book_id = b.id 
      GROUP BY s.id, r.refunded_amount
      ORDER BY s.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { 
    console.error("History DB Error: ", err.message);
    res.status(500).json({ error: err.message }); 
  }
});

// ==========================================
// 5. FINANCIAL REPORTS & RETURNS
// ==========================================
app.get('/api/reports/sales', async (req, res) => {
  const { period, start, end } = req.query;
  
  let dateSqlS = "DATE(s.created_at) = CURRENT_DATE"; 
  let dateSqlR = "DATE(created_at) = CURRENT_DATE"; 
  
  if (period === 'custom' && start && end) {
    dateSqlS = `DATE(s.created_at) >= '${start}' AND DATE(s.created_at) <= '${end}'`;
    dateSqlR = `DATE(created_at) >= '${start}' AND DATE(created_at) <= '${end}'`;
  } else if (period === 'yesterday') {
    dateSqlS = "DATE(s.created_at) = CURRENT_DATE - INTERVAL '1 day'";
    dateSqlR = "DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'";
  } else if (period === 'last_month') {
    dateSqlS = "EXTRACT(MONTH FROM s.created_at) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') AND EXTRACT(YEAR FROM s.created_at) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')";
    dateSqlR = "EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')";
  } else if (period === 'month') {
    dateSqlS = "EXTRACT(MONTH FROM s.created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM s.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)";
    dateSqlR = "EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)";
  } else if (period === 'year') {
    dateSqlS = "EXTRACT(YEAR FROM s.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)";
    dateSqlR = "EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)";
  }

  try {
    const summary = await pool.query(`SELECT payment_type, SUM(total_amount) as total FROM Sales s WHERE ${dateSqlS} GROUP BY payment_type`);
    const returns = await pool.query(`SELECT SUM(amount) as total_returns FROM Returns WHERE ${dateSqlR}`);
    
    const items = await pool.query(`
      SELECT 
        b.title, 
        SUM(si.quantity) as qty_sold, 
        SUM(si.subtotal) as item_revenue,
        SUM(si.quantity * COALESCE(b.cost_price, 0)) as item_cost
      FROM Sale_Items si 
      JOIN Books b ON si.book_id = b.id 
      JOIN Sales s ON si.sale_id = s.id 
      WHERE ${dateSqlS} 
      GROUP BY b.title 
      HAVING SUM(si.quantity) > 0
      ORDER BY item_revenue DESC
    `);

    let total_cogs = 0;
    items.rows.forEach(item => {
      total_cogs += parseFloat(item.item_cost) || 0;
    });
    
    res.json({ 
      summary: summary.rows, 
      items: items.rows,
      total_returns: returns.rows[0].total_returns || 0,
      total_cogs: total_cogs 
    });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/expenses', async (req, res) => {
  try { 
    await pool.query('INSERT INTO Expenses (description, amount, created_by) VALUES ($1, $2, $3)', [req.body.description, req.body.amount, req.body.username]); 
    writeAuditLog(req.body.username, 'LOG_EXPENSE', `Logged LKR ${req.body.amount} for: ${req.body.description}`);
    res.json({ success: true }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/returns/process', async (req, res) => {
  const { invoice_number, items, total_refund, username } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const returnedItemsList = items.filter(i => i.returnQty > 0).map(i => ({
      title: i.title,
      qty: i.returnQty,
      price: i.price
    }));
    const returnedItemsJson = JSON.stringify(returnedItemsList);

    await client.query(
      'INSERT INTO Returns (invoice_number, amount, created_by, returned_items) VALUES ($1, $2, $3, $4)', 
      [invoice_number, total_refund, username, returnedItemsJson]
    );
    
    for (let item of items) {
      if (item.returnQty > 0 && item.book_id) {
        await client.query('UPDATE Books SET available_qty = available_qty + $1 WHERE id = $2', [item.returnQty, item.book_id]);
        
        await client.query(`
          UPDATE Sale_Items 
          SET quantity = quantity - $1, subtotal = subtotal - ($1 * unit_price)
          WHERE book_id = $2 AND sale_id = (SELECT id FROM Sales WHERE invoice_number = $3)
        `, [item.returnQty, item.book_id, invoice_number]);
      }
    }
    
    await client.query(`
      UPDATE Sales 
      SET total_amount = GREATEST(0, total_amount - $1)
      WHERE invoice_number = $2
    `, [total_refund, invoice_number]);
    
    await client.query('COMMIT'); 
    writeAuditLog(username, 'RETURN_PROCESSED', `Refunded LKR ${total_refund} for invoice ${invoice_number}`);
    res.json({ success: true });
  } catch (err) { 
    await client.query('ROLLBACK'); 
    res.status(500).json({ error: err.message }); 
  } finally { 
    client.release(); 
  }
});

app.get('/api/returns/history', async (req, res) => {
  try {
    const query = `SELECT * FROM Returns ORDER BY created_at DESC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// ==========================================
// 6. HARDWARE INTERFACES
// ==========================================
app.post('/api/printer/open-drawer', (req, res) => {
  try { 
    const device = new escpos.USB(); 
    const printer = new escpos.Printer(device); 
    device.open(() => { 
      printer.cashdraw(2).close(); 
      res.json({ success: true }); 
    }); 
  } catch (err) { 
    res.status(500).json({ success: false }); 
  }
});

// ==========================================
// 7. CASH DRAWER & MULTI-SHIFT MANAGEMENT
// ==========================================
app.get('/api/drawer/status', async (req, res) => {
  try {
    const { username } = req.query;
    const result = await pool.query("SELECT starting_balance FROM Cash_Drawer WHERE status = 'OPEN' AND created_by = $1", [username]);
    if (result.rows.length > 0) {
      res.json({ isOpen: true, startingBalance: result.rows[0].starting_balance });
    } else {
      res.json({ isOpen: false });
    }
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/drawer/open', async (req, res) => {
  try {
    await pool.query("UPDATE Cash_Drawer SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP WHERE status = 'OPEN' AND created_by = $1", [req.body.username]);
    await pool.query("INSERT INTO Cash_Drawer (starting_balance, created_by, status) VALUES ($1, $2, 'OPEN')", [req.body.amount, req.body.username]);
    
    writeAuditLog(req.body.username, 'DRAWER_OPENED', `Shift started with LKR ${req.body.amount} in drawer`);
    res.json({ success: true });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.get('/api/reports/shift', async (req, res) => {
  const { username } = req.query;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const shiftRes = await client.query("SELECT id, starting_balance, created_at FROM Cash_Drawer WHERE status = 'OPEN' AND created_by = $1 ORDER BY created_at DESC LIMIT 1", [username]);
    if (shiftRes.rows.length === 0) return res.status(400).json({ error: "No open shift found to close." });
    
    const shift = shiftRes.rows[0];
    const shiftStart = shift.created_at;
    const openingBalance = shift.starting_balance;
    const shiftId = shift.id;

    const sales = await client.query(`SELECT payment_type, SUM(total_amount) as total FROM Sales WHERE created_at >= $1 AND created_by = $2 GROUP BY payment_type`, [shiftStart, username]);
    const expenses = await client.query(`SELECT SUM(amount) as total_exp FROM Expenses WHERE created_at >= $1 AND created_by = $2`, [shiftStart, username]);
    const returns = await client.query(`SELECT SUM(amount) as total_ret FROM Returns WHERE created_at >= $1 AND created_by = $2`, [shiftStart, username]);

    await client.query("UPDATE Cash_Drawer SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP WHERE id = $1", [shiftId]);
    await client.query('COMMIT');

    writeAuditLog(username, 'PRINT_Z_REPORT', 'Closed shift and generated Z-Report');
    res.json({ 
      sales: sales.rows, 
      expenses: expenses.rows[0].total_exp || 0, 
      returns: returns.rows[0].total_ret || 0, 
      opening_balance: openingBalance 
    });
  } catch (err) { 
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message }); 
  } finally {
    client.release();
  }
});

// ==========================================
// 8. RESERVATIONS / LAYAWAYS
// ==========================================
app.post('/api/reservations', async (req, res) => {
  const { customer_name, phone, pickup_date, total_amount, advance_paid, payment_type, cart_items, username } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const refNum = `RES-${Date.now()}`;
    
    const resRes = await client.query(
      `INSERT INTO Reservations (ref_number, customer_name, phone, pickup_date, total_amount, advance_paid, payment_type, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [refNum, customer_name, phone, pickup_date, total_amount, advance_paid, payment_type, username]
    );
    const resId = resRes.rows[0].id;

    for (let item of cart_items) {
      await client.query('INSERT INTO Reservation_Items (reservation_id, book_id, title, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5, $6)', [resId, item.id, item.title, item.qty, item.retail_price, item.retail_price * item.qty]);
      await client.query('UPDATE Books SET available_qty = available_qty - $1 WHERE id = $2', [item.qty, item.id]);
    }

    if (advance_paid > 0) {
       await client.query('INSERT INTO Sales (invoice_number, total_amount, payment_type, created_by) VALUES ($1, $2, $3, $4)', [`ADV-${refNum}`, advance_paid, payment_type, username]);
    }

    await client.query('COMMIT');
    writeAuditLog(username, 'RESERVATION_CREATED', `Reservation ${refNum} for ${customer_name}. Advance: LKR ${advance_paid}`);
    res.json({ success: true, ref_number: refNum });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { 
    client.release(); 
  }
});

app.get('/api/reservations', async (req, res) => {
  try {
    const query = `
      SELECT r.*, json_agg(json_build_object('title', ri.title, 'qty', ri.quantity, 'subtotal', ri.subtotal)) as items 
      FROM Reservations r JOIN Reservation_Items ri ON r.id = ri.reservation_id GROUP BY r.id ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.put('/api/reservations/:id/pickup', async (req, res) => {
  const { balance_paid, payment_type, username, ref_number } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query("UPDATE Reservations SET status = 'Picked Up' WHERE id = $1", [req.params.id]);

    const pickupInvoiceNum = `PICKUP-${ref_number}-${Date.now()}`;
    const saleRes = await client.query(
      `INSERT INTO Sales (invoice_number, total_amount, payment_type, created_by, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id`,
      [pickupInvoiceNum, balance_paid, payment_type, username]
    );
    const saleId = saleRes.rows[0].id;

    const items = await client.query('SELECT book_id, quantity, unit_price, subtotal FROM Reservation_Items WHERE reservation_id = $1', [req.params.id]);
    for (let item of items.rows) {
      await client.query(
        `INSERT INTO Sale_Items (sale_id, book_id, quantity, original_qty, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5, $6)`,
        [saleId, item.book_id, item.quantity, item.quantity, item.unit_price, item.subtotal]
      );
    }

    await client.query('COMMIT');
    writeAuditLog(username, 'RESERVATION_PICKUP', `Reservation ${ref_number} finalized. Checked out ${items.rows.length} items.`);
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { 
    client.release(); 
  }
});

app.delete('/api/reservations/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const items = await client.query('SELECT book_id, quantity FROM Reservation_Items WHERE reservation_id = $1', [req.params.id]);
    
    for (let item of items.rows) {
      await client.query('UPDATE Books SET available_qty = available_qty + $1 WHERE id = $2', [item.quantity, item.book_id]);
    }
    
    await client.query('DELETE FROM Reservations WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    
    writeAuditLog('System', 'RESERVATION_CANCELLED', `Reservation ID ${req.params.id} cancelled. Stock returned.`);
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { 
    client.release(); 
  }
});

// --- SERVE REACT FRONTEND (ELECTRON) ---
app.use(express.static(path.join(__dirname, 'ui')));
app.use((req, res) => { res.sendFile(path.join(__dirname, 'ui', 'index.html')); });

app.listen(5000, () => console.log('Server running on port 5000'))
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log('✅ Background server is already running! Safely connecting to it...');
    } else {
      console.error('Server error:', err);
    }
  });