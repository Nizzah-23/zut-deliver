const pool = require('./db');

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) CHECK (role IN ('buyer', 'seller', 'delivery')),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        product_id SERIAL PRIMARY KEY,
        seller_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock INT DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        order_id SERIAL PRIMARY KEY,
        buyer_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        seller_id INT REFERENCES users(user_id),
        delivery_id INT REFERENCES users(user_id),
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending'
          CHECK (status IN ('pending','confirmed','out_for_delivery','delivered','cancelled')),
        delivery_address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        item_id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
        product_id INT REFERENCES products(product_id),
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS deliveries (
        delivery_id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
        delivery_guy_id INT REFERENCES users(user_id),
        status VARCHAR(20) DEFAULT 'assigned'
          CHECK (status IN ('assigned','picked_up','on_the_way','delivered')),
        current_location TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ All tables created successfully!');
    process.exit(0);
  } catch (err) {
    console.error(' Error creating tables:', err.message);
    process.exit(1);
  }
};

createTables();