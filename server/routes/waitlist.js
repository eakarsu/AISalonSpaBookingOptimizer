const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, c.name as client_name, s.name as service_name
      FROM waitlist w
      LEFT JOIN clients c ON w.client_id = c.id
      LEFT JOIN services s ON w.service_id = s.id
      ORDER BY w.priority DESC, w.created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, c.name as client_name, s.name as service_name
      FROM waitlist w
      LEFT JOIN clients c ON w.client_id = c.id
      LEFT JOIN services s ON w.service_id = s.id
      WHERE w.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Waitlist entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { client_id, service_id, preferred_stylist_id, preferred_date, preferred_time, priority, notes, status } = req.body;
    const result = await pool.query(
      `INSERT INTO waitlist (client_id, service_id, preferred_stylist_id, preferred_date, preferred_time, priority, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [client_id, service_id, preferred_stylist_id, preferred_date, preferred_time, priority || 'medium', notes, status || 'waiting']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { client_id, service_id, preferred_stylist_id, preferred_date, preferred_time, priority, notes, status } = req.body;
    const result = await pool.query(
      `UPDATE waitlist SET client_id=$1, service_id=$2, preferred_stylist_id=$3, preferred_date=$4,
       preferred_time=$5, priority=$6, notes=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [client_id, service_id, preferred_stylist_id, preferred_date, preferred_time, priority, notes, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Waitlist entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM waitlist WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Waitlist entry not found' });
    res.json({ message: 'Waitlist entry deleted', entry: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
