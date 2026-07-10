const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { protect, authorizeRoles } = require('../middleware/auth');

// GET ALL AVAILABLE PRODUCTS (buyers can browse)
router.get('/products', protect, authorizeRoles('buyer'), async (req, res) => {
  try {
    const products = await pool.query(
      `SELECT p.*, u.name as seller_name, u.phone as seller_phone
       FROM products p
       JOIN users u ON p.seller_id = u.user_id
       WHERE p.stock > 0
       ORDER BY p.created_at DESC`
    );
    res.json({ products: products.rows });
  } catch (err) {
    console.error('Get products error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PLACE AN ORDER (buyers only)
router.post('/orders', protect, authorizeRoles('buyer'), async (req, res) => {
  const { seller_id, delivery_address, items } = req.body;
  const buyer_id = req.user.user_id;

  try {
    // Validate items exist and have stock
    let total_amount = 0;
    for (const item of items) {
      const product = await pool.query(
        'SELECT * FROM products WHERE product_id = $1', 
        [item.product_id]
      );
      if (product.rows.length === 0) {
        return res.status(404).json({ message: `Product ${item.product_id} not found` });
      }
      if (product.rows[0].stock < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${product.rows[0].name}` });
      }
      total_amount += product.rows[0].price * item.quantity;
    }

    // Create order
    const order = await pool.query(
      `INSERT INTO orders (buyer_id, seller_id, total_amount, delivery_address, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [buyer_id, seller_id, total_amount, delivery_address]
    );

    const order_id = order.rows[0].order_id;

    // Add order items & update stock
    for (const item of items) {
      // Insert order item
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, (SELECT price FROM products WHERE product_id = $2))`,
        [order_id, item.product_id, item.quantity]
      );

      // Reduce stock
      await pool.query(
        'UPDATE products SET stock = stock - $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
    }

    res.status(201).json({ 
      message: 'Order placed successfully!', 
      order: order.rows[0] 
    });
  } catch (err) {
    console.error('Order creation error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET MY ORDERS (buyers only)
router.get('/orders', protect, authorizeRoles('buyer'), async (req, res) => {
  const buyer_id = req.user.user_id;

  try {
    const orders = await pool.query(
      `SELECT o.*, u.name as seller_name
       FROM orders o
       JOIN users u ON o.seller_id = u.user_id
       WHERE o.buyer_id = $1
       ORDER BY o.created_at DESC`,
      [buyer_id]
    );
    res.json({ orders: orders.rows });
  } catch (err) {
    console.error('Get orders error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// TRACK ORDER STATUS (buyers only)
router.get('/orders/:id/track', protect, authorizeRoles('buyer'), async (req, res) => {
  const { id } = req.params;
  const buyer_id = req.user.user_id;

  try {
    const order = await pool.query(
      `SELECT o.*, d.status as delivery_status, d.current_location,
              u.name as delivery_guy_name, u.phone as delivery_guy_phone
       FROM orders o
       LEFT JOIN deliveries d ON o.order_id = d.order_id
       LEFT JOIN users u ON d.delivery_guy_id = u.user_id
       WHERE o.order_id = $1 AND o.buyer_id = $2`,
      [id, buyer_id]
    );
    if (order.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ order: order.rows[0] });
  } catch (err) {
    console.error('Track order error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;