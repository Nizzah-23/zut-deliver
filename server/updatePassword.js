require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const p = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin123',
  database: 'school_delivery'
});

const update = async () => {
  try {
    const hash = await bcrypt.hash('nizzah0007', 10);
    const res = await p.query(
      'UPDATE users SET password = $1, email = $2, role = $3 WHERE user_id = 1 RETURNING name, email, role',
      [hash, 'nizzahkalombe23@gmail.com', 'admin']
    );
    console.log('✅ Updated:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

update();