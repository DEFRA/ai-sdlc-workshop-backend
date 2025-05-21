const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'database.sqlite');
let db;

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(dbPath);
  }
  return db;
}

// Check if a column exists in a table
async function columnExists(tableName, columnName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Check if the column exists in any row
      const columnExists = rows.some(col => col && col.name === columnName);
      resolve(columnExists);
    });
  });
}

// Add a column to a table if it doesn't exist
async function addColumnIfNotExists(tableName, columnName, columnType) {
  try {
    const exists = await columnExists(tableName, columnName);
    if (!exists) {
      return new Promise((resolve, reject) => {
        const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
        console.log(`Adding column: ${columnName} to table: ${tableName}`);
        db.run(sql, (err) => {
          if (err) {
            console.error(`Error adding column ${columnName}:`, err.message);
            reject(err);
            return;
          }
          console.log(`Column ${columnName} added successfully`);
          resolve();
        });
      });
    } else {
      console.log(`Column ${columnName} already exists in ${tableName}`);
      return Promise.resolve();
    }
  } catch (error) {
    console.error(`Error checking column ${columnName}:`, error);
    return Promise.reject(error);
  }
}

async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Get all columns in the registrations table
    const columns = await new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(registrations)`, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
    
    console.log('Current columns:', columns.map(col => col.name).join(', '));
    
    // Add receipt_preference column
    await addColumnIfNotExists('registrations', 'receipt_preference', 'TEXT');
    
    // Add email_address column
    await addColumnIfNotExists('registrations', 'email_address', 'TEXT');
    
    // Add mobile_phone_number column
    await addColumnIfNotExists('registrations', 'mobile_phone_number', 'TEXT');
    
    console.log('Migrations completed successfully');
    return Promise.resolve();
  } catch (error) {
    console.error('Error running migrations:', error);
    return Promise.reject(error);
  }
}

async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
      
      try {
        // Create the registrations table if it doesn't exist
        await new Promise((tableResolve, tableReject) => {
          db.run(`
            CREATE TABLE IF NOT EXISTS registrations (
              id TEXT PRIMARY KEY,
              referenceNumber TEXT NOT NULL,
              formType TEXT NOT NULL,
              formTypeOtherText TEXT,
              penColourNotUsed TEXT NOT NULL,
              guidanceRead TEXT NOT NULL,
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error('Error creating registrations table:', err.message);
              tableReject(err);
              return;
            }
            console.log('Database table check completed');
            tableResolve();
          });
        });
        
        // Run migrations to add new columns
        await runMigrations();
        
        console.log('Database initialization completed');
        resolve();
      } catch (error) {
        console.error('Database initialization failed:', error);
        reject(error);
      }
    });
  });
}

// Function to close the database connection
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
          reject(err);
          return;
        }
        console.log('Database connection closed');
        db = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  getDatabase,
  initializeDatabase,
  closeDatabase
}; 