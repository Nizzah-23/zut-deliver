const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/orders', protect, authorizeRoles('delivery'), async (req, res) => {
  const delivery_guy_id = req.user.user_id;
  try {
    const orders = await pool.query(
      `SELECT o.*, u1.name as buyer_name, u2.name as seller_name
       FROM orders o JOIN users u1 ON o.buyer_id = u1.user_id
       JOIN users u2 ON o.seller_id = u2.user_id
       WHERE o.delivery_id = $1 ORDER BY o.created_at DESC`,
      [delivery_guy_id]
    );
    res.json({ orders: orders.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/orders/available', protect, authorizeRoles('delivery'), async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT o.*, u1.name as buyer_name, u2.name as seller_name FROM orders o
       JOIN users u1 ON o.buyer_id = u1.user_id JOIN users u2 ON o.seller_id = u2.user_id
       WHERE o.delivery_id IS NULL AND o.status = 'confirmed' ORDER BY o.created_at ASC`
    );
    res.json({ orders: orders.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/orders/:id/accept', protect, authorizeRoles('delivery'), async (req, res) => {
  const { id } = req.params;
  const delivery_guy_id = req.user.user_id;
  try {
    const order = await pool.query(
      `UPDATE orders SET delivery_id = $1, status = 'out_for_delivery'
       WHERE order_id = $2 AND delivery_id IS NULL RETURNING *`,
      [delivery_guy_id, id]
    );
    if (order.rows.length === 0) return res.status(400).json({ message: 'Order not available' });
    await pool.query(`INSERT INTO deliveries (order_id, delivery_guy_id, status) VALUES ($1, $2, 'assigned')`, [id, delivery_guy_id]);
    res.json({ message: 'Order accepted!', order: order.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/orders/:id/location', protect, authorizeRoles('delivery'), async (req, res) => {
  const { id } = req.params;
  const { current_location, status } = req.body;
  const delivery_guy_id = req.user.user_id;
  try {
    const delivery = await pool.query(
      `UPDATE deliveries SET current_location = $1, status = $2, updated_at = NOW()
       WHERE order_id = $3 AND delivery_guy_id = $4 RETURNING *`,
      [current_location, status, id, delivery_guy_id]
    );
    if (delivery.rows.length === 0) return res.status(404).json({ message: 'Delivery not found' });
    if (status === 'delivered') await pool.query(`UPDATE orders SET status = 'delivered' WHERE order_id = $1`, [id]);
    res.json({ message: 'Location updated!', delivery: delivery.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;