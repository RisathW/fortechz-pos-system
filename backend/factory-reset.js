const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', 
  host: 'localhost', 
  database: 'bookshop_pos', 
  password: 'Risa2007', 
  port: 5432,
});

async function factoryReset() {
  try {
    console.log("🚨 WARNING: Initiating complete factory reset...");
    
    await pool.query(`
      TRUNCATE TABLE Sales CASCADE;
      TRUNCATE TABLE Stock_Transactions CASCADE;
      TRUNCATE TABLE Expenses CASCADE;
      TRUNCATE TABLE Returns CASCADE;
      TRUNCATE TABLE Books CASCADE;
      TRUNCATE TABLE Suppliers CASCADE;
      -- We do NOT truncate Users, so you don't lock yourself out!
    `);

    console.log("✅ SUCCESS: The database is completely blank and ready for real data.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    pool.end();
  }
}

factoryReset();