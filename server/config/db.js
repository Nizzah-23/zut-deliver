const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'school_delivery'
});

pool.connect()
  .then(() => console.log(' PostgreSQL connected successfully!'))
  .catch((err) => console.error(' Database connection error:', err.message));

module.exports = pool;