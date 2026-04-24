const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, s.name as stylist_name
      FROM payroll p
      LEFT JOIN stylists s ON p.stylist_id = s.id
      ORDER BY p.pay_period_end DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.name as stylist_name, s.hourly_rate,
        COALESCE(SUM(b.total_price), 0) as total_revenue,
        COUNT(DISTINCT b.id) as total_bookings,
        COALESCE(SUM(t.amount), 0) as total_tips,
        COALESCE(SUM(b.total_price) * 0.4, 0) as estimated_commission
      FROM stylists s
      LEFT JOIN bookings b ON s.id = b.stylist_id AND b.status = 'completed'
      LEFT JOIN tips t ON s.id = t.stylist_id
      GROUP BY s.id, s.name, s.hourly_rate
      ORDER BY total_revenue DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { stylist_id, pay_period_start, pay_period_end, base_pay, commission_amount, tips_amount, deductions, bonus, notes } = req.body;
    const total = (parseFloat(base_pay) || 0) + (parseFloat(commission_amount) || 0) +
                  (parseFloat(tips_amount) || 0) + (parseFloat(bonus) || 0) - (parseFloat(deductions) || 0);
    const result = await pool.query(
      `INSERT INTO payroll (stylist_id, pay_period_start, pay_period_end, base_pay, commission_amount, tips_amount, deductions, bonus, total_pay, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10) RETURNING *`,
      [stylist_id, pay_period_start, pay_period_end, base_pay || 0, commission_amount || 0, tips_amount || 0, deductions || 0, bonus || 0, total, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const result = await pool.query(
      `UPDATE payroll SET status=$1, notes=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payroll record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM payroll WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payroll record not found' });
    res.json({ message: 'Payroll record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
