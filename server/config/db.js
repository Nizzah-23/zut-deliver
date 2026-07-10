const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_URL if available (Railway provides this)
// Otherwise build from individual vars
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString: connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection once (properly!)
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error(' Database connection error:', err.message);
  } else {
    console.log(' PostgreSQL connected successfully!');
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err);
});

module.exports = pool;
