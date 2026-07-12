const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/users', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await pool.query(`SELECT user_id, name, email, role, phone, is_banned, created_at FROM users ORDER BY created_at DESC`);
    res.json({ users: users.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/users/:id/ban', protect, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { is_banned } = req.body;
  try {
    const user = await pool.query(`UPDATE users SET is_banned = $1 WHERE user_id = $2 RETURNING user_id, name, email, role, is_banned`, [is_banned, id]);
    if (user.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: is_banned ? 'User banned!' : 'User unbanned!', user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/users/:id', protect, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM deliveries WHERE delivery_guy_id = $1', [id]);
    await pool.query('DELETE FROM orders WHERE buyer_id = $1', [id]);
    await pool.query('DELETE FROM products WHERE seller_id = $1', [id]);
    await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
    res.json({ message: 'User deleted!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/orders', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const orders = await pool.query(`SELECT o.*, u1.name as buyer_name, u2.name as seller_name, u3.name as delivery_name FROM orders o
       JOIN users u1 ON o.buyer_id = u1.user_id JOIN users u2 ON o.seller_id = u2.user_id
       LEFT JOIN users u3 ON o.delivery_id = u3.user_id ORDER BY o.created_at DESC`);
    res.json({ orders: orders.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/products', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const products = await pool.query(`SELECT p.*, u.name as seller_name FROM products p
       JOIN users u ON p.seller_id = u.user_id ORDER BY p.created_at DESC`);
    res.json({ products: products.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/products/:id', protect, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM order_items WHERE product_id = $1', [id]);
    await pool.query('DELETE FROM products WHERE product_id = $1', [id]);
    res.json({ message: 'Product deleted!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;