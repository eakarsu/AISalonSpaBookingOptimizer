const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all schedules (with stylist name)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, st.name as stylist_name
       FROM schedules s
       LEFT JOIN stylists st ON s.stylist_id = st.id
       ORDER BY st.name, s.day_of_week`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single schedule
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, st.name as stylist_name
       FROM schedules s
       LEFT JOIN stylists st ON s.stylist_id = st.id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Schedule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create schedule
router.post('/', async (req, res) => {
  try {
    const { stylist_id, day_of_week, start_time, end_time, break_start, break_end, is_available, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO schedules (stylist_id, day_of_week, start_time, end_time, break_start, break_end, is_available, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [stylist_id, day_of_week, start_time, end_time, break_start, break_end, is_available !== false, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update schedule
router.put('/:id', async (req, res) => {
  try {
    const { stylist_id, day_of_week, start_time, end_time, break_start, break_end, is_available, notes } = req.body;
    const result = await pool.query(
      `UPDATE schedules SET stylist_id=$1, day_of_week=$2, start_time=$3, end_time=$4,
       break_start=$5, break_end=$6, is_available=$7, notes=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [stylist_id, day_of_week, start_time, end_time, break_start, break_end, is_available !== false, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Schedule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete schedule
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM schedules WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ message: 'Schedule deleted', schedule: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
