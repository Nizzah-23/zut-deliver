const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { protect, authorizeRoles } = require('../middleware/auth');

// GET ALL USERS
router.get('/users', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT user_id, name, email, role, phone, is_banned, created_at 
       FROM users ORDER BY created_at DESC`
    );
    res.json({ users: users.rows });
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// BAN / UNBAN USER
router.put('/users/:id/ban', protect, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { is_banned } = req.body;
  try {
    const user = await pool.query(
      `UPDATE users SET is_banned = $1 WHERE user_id = $2 RETURNING user_id, name, email, role, is_banned`,
      [is_banned, id]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ 
      message: is_banned ? 'User banned!' : 'User unbanned!', 
      user: user.rows[0] 
    });
  } catch (err) {
    console.error('Ban user error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE USER
router.delete('/users/:id', protect, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM deliveries WHERE delivery_guy_id = $1', [id]);
    await pool.query('DELETE FROM deliveries WHERE order_id IN (SELECT order_id FROM orders WHERE buyer_id = $1)', [id]);
    await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE buyer_id = $1)', [id]);
    await pool.query('DELETE FROM orders WHERE buyer_id = $1', [id]);
    await pool.query('DELETE FROM order_items WHERE product_id IN (SELECT product_id FROM products WHERE seller_id = $1)', [id]);
    await pool.query('DELETE FROM products WHERE seller_id = $1', [id]);
    await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
    res.json({ message: 'User deleted successfully!' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET ALL ORDERS
router.get('/orders', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT o.*, 
              u1.name as buyer_name, 
              u2.name as seller_name,
              u3.name as delivery_name
       FROM orders o
       JOIN users u1 ON o.buyer_id = u1.user_id
       JOIN users u2 ON o.seller_id = u2.user_id
       LEFT JOIN users u3 ON o.delivery_id = u3.user_id
       ORDER BY o.created_at DESC`
    );
    res.json({ orders: orders.rows });
  } catch (err) {
    console.error('Get orders error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET ALL PRODUCTS
router.get('/products', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const products = await pool.query(
      `SELECT p.*, u.name as seller_name 
       FROM products p
       JOIN users u ON p.seller_id = u.user_id
       ORDER BY p.created_at DESC`
    );
    res.json({ products: products.rows });
  } catch (err) {
    console.error('Get products error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE ANY PRODUCT
router.delete('/products/:id', protect, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM deliveries WHERE order_id IN (SELECT order_id FROM order_items WHERE product_id = $1)', [id]);
    await pool.query('DELETE FROM order_items WHERE product_id = $1', [id]);
    await pool.query('DELETE FROM products WHERE product_id = $1', [id]);
    res.json({ message: 'Product deleted!' });
  } catch (err) {
    console.error('Delete product error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET PLATFORM STATS
router.get('/stats', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await pool.query('SELECT COUNT(*) FROM users WHERE role != $1', ['admin']);
    const sellers = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['seller']);
    const buyers = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['buyer']);
    const delivery = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['delivery']);
    const orders = await pool.query('SELECT COUNT(*) FROM orders');
    const products = await pool.query('SELECT COUNT(*) FROM products');
    const revenue = await pool.query('SELECT SUM(total_amount) FROM orders WHERE status = $1', ['delivered']);
    const banned = await pool.query('SELECT COUNT(*) FROM users WHERE is_banned = true');

    res.json({
      stats: {
        total_users: users.rows[0].count,
        total_sellers: sellers.rows[0].count,
        total_buyers: buyers.rows[0].count,
        total_delivery: delivery.rows[0].count,
        total_orders: orders.rows[0].count,
        total_products: products.rows[0].count,
        total_revenue: revenue.rows[0].sum || 0,
        banned_users: banned.rows[0].count
      }
    });
  } catch (err) {
    console.error('Get stats error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;