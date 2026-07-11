const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { protect, authorizeRoles } = require('../middleware/auth');

// ADD A PRODUCT (sellers only)
router.post('/products', protect, authorizeRoles('seller'), async (req, res) => {
  const { name, description, price, stock, image_url } = req.body;
  const seller_id = req.user.user_id;

  try {
    const product = await pool.query(
      `INSERT INTO products (seller_id, name, description, price, stock, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [seller_id, name, description, price, stock, image_url]
    );
    res.status(201).json({ message: 'Product added!', product: product.rows[0] });
  } catch (err) {
    console.error('Add product error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET ALL MY PRODUCTS (sellers only)
router.get('/products', protect, authorizeRoles('seller'), async (req, res) => {
  const seller_id = req.user.user_id;

  try {
    const products = await pool.query(
      `SELECT p.*, u.name as seller_name, u.phone as seller_phone
       FROM products p
       JOIN users u ON p.seller_id = u.user_id
       WHERE p.seller_id = $1
       ORDER BY p.created_at DESC`,
      [seller_id]
    );
    res.json({ products: products.rows });
  } catch (err) {
    console.error('Get products error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// UPDATE A PRODUCT (sellers only)
router.put('/products/:id', protect, authorizeRoles('seller'), async (req, res) => {
  const { name, description, price, stock, image_url } = req.body;
  const { id } = req.params;
  const seller_id = req.user.user_id;

  try {
    const product = await pool.query(
      `UPDATE products SET name=$1, description=$2, price=$3, stock=$4, image_url=$5
       WHERE product_id=$6 AND seller_id=$7 RETURNING *`,
      [name, description, price, stock, image_url, id, seller_id]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found or not yours' });
    }
    res.json({ message: 'Product updated!', product: product.rows[0] });
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE A PRODUCT (sellers only)
router.delete('/products/:id', protect, authorizeRoles('seller'), async (req, res) => {
  const { id } = req.params;
  const seller_id = req.user.user_id;

  try {
    const product = await pool.query(
      'DELETE FROM products WHERE product_id=$1 AND seller_id=$2 RETURNING *',
      [id, seller_id]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found or not yours' });
    }
    res.json({ message: 'Product deleted!' });
  } catch (err) {
    console.error('Delete product error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET ALL ORDERS FOR MY PRODUCTS (sellers only)
router.get('/orders', protect, authorizeRoles('seller'), async (req, res) => {
  const seller_id = req.user.user_id;

  try {
    const orders = await pool.query(
      `SELECT o.*, u.name as buyer_name, u.phone as buyer_phone
       FROM orders o
       JOIN users u ON o.buyer_id = u.user_id
       WHERE o.seller_id = $1
       ORDER BY o.created_at DESC`,
      [seller_id]
    );
    res.json({ orders: orders.rows });
  } catch (err) {
    console.error('Get seller orders error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// UPDATE ORDER STATUS (sellers only)
router.put('/orders/:id/status', protect, authorizeRoles('seller'), async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const seller_id = req.user.user_id;

  try {
    const order = await pool.query(
      `UPDATE orders SET status=$1 
       WHERE order_id=$2 AND seller_id=$3 RETURNING *`,
      [status, id, seller_id]
    );
    if (order.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order status updated!', order: order.rows[0] });
  } catch (err) {
    console.error('Update order status error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;