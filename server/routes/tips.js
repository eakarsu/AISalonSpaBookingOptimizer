const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, s.name as stylist_name, c.name as client_name, sv.name as service_name
      FROM tips t
      LEFT JOIN stylists s ON t.stylist_id = s.id
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN services sv ON t.service_id = sv.id
      ORDER BY t.tip_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.name as stylist_name,
        COUNT(t.id) as total_tips,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COALESCE(AVG(t.amount), 0) as avg_tip
      FROM stylists s
      LEFT JOIN tips t ON s.id = t.stylist_id
      GROUP BY s.id, s.name
      ORDER BY total_amount DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { stylist_id, client_id, service_id, booking_id, amount, payment_method, tip_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO tips (stylist_id, client_id, service_id, booking_id, amount, payment_method, tip_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [stylist_id, client_id, service_id, booking_id, amount, payment_method || 'cash', tip_date || new Date(), notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tips WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tip not found' });
    res.json({ message: 'Tip deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
