require('dotenv').config();
const { Pool } = require('pg');

const p = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin123',
  database: 'school_delivery'
});

const setup = async () => {
  try {
    // Step 1 - Drop old role constraint
    await p.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    console.log('✅ Old constraint removed');

    // Step 2 - Add new role constraint with admin
    await p.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('buyer', 'seller', 'delivery', 'admin'))
    `);
    console.log('✅ New constraint added');

    // Step 3 - Add is_banned column
    await p.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ is_banned column added');

    // Step 4 - Make Nizzah admin
    const res = await p.query(
      `UPDATE users SET role = 'admin' WHERE email = 'nizzah@test.com' RETURNING name, email, role`
    );
    console.log('✅ Admin set:', res.rows[0]);

    console.log('🎉 All done!');
    process.exit(0);
  } catch (err) {
    console.error(' Error:', err.message);
    process.exit(1);
  }
};

setup();