const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, c.name as client_name, c.email as client_email, c.phone as client_phone
      FROM memberships m
      LEFT JOIN clients c ON m.client_id = c.id
      ORDER BY m.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM membership_plans ORDER BY price ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/plans', async (req, res) => {
  try {
    const { name, description, price, billing_cycle, included_services, max_bookings_per_month, discount_percent } = req.body;
    const result = await pool.query(
      `INSERT INTO membership_plans (name, description, price, billing_cycle, included_services, max_bookings_per_month, discount_percent)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, price, billing_cycle || 'monthly', included_services, max_bookings_per_month, discount_percent || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { client_id, plan_id, start_date, payment_method } = req.body;
    const plan = await pool.query('SELECT * FROM membership_plans WHERE id = $1', [plan_id]);
    if (plan.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });

    const p = plan.rows[0];
    const endDate = p.billing_cycle === 'annual'
      ? new Date(new Date(start_date).setFullYear(new Date(start_date).getFullYear() + 1))
      : new Date(new Date(start_date).setMonth(new Date(start_date).getMonth() + 1));

    const result = await pool.query(
      `INSERT INTO memberships (client_id, plan_id, plan_name, start_date, end_date, price, status, payment_method, bookings_used)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, 0) RETURNING *`,
      [client_id, plan_id, p.name, start_date, endDate.toISOString().split('T')[0], p.price, payment_method || 'credit_card']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/cancel', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE memberships SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Membership not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/plans/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM membership_plans WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
