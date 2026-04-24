const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT lp.*, c.name as client_name
      FROM loyalty_points lp
      LEFT JOIN clients c ON lp.client_id = c.id
      ORDER BY lp.transaction_date DESC, lp.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT lp.*, c.name as client_name
      FROM loyalty_points lp
      LEFT JOIN clients c ON lp.client_id = c.id
      WHERE lp.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Loyalty record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { client_id, points_earned, points_redeemed, balance, source, reference_id, description, transaction_date } = req.body;
    const result = await pool.query(
      `INSERT INTO loyalty_points (client_id, points_earned, points_redeemed, balance, source, reference_id, description, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [client_id, points_earned || 0, points_redeemed || 0, balance || 0, source, reference_id, description, transaction_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { client_id, points_earned, points_redeemed, balance, source, reference_id, description, transaction_date } = req.body;
    const result = await pool.query(
      `UPDATE loyalty_points SET client_id=$1, points_earned=$2, points_redeemed=$3, balance=$4, source=$5,
       reference_id=$6, description=$7, transaction_date=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [client_id, points_earned, points_redeemed, balance, source, reference_id, description, transaction_date, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Loyalty record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM loyalty_points WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Loyalty record not found' });
    res.json({ message: 'Loyalty record deleted', loyalty: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
