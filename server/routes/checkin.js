const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ci.*, c.name as client_name, s.name as stylist_name, sv.name as service_name,
        b.booking_date, b.start_time, b.end_time
      FROM checkins ci
      LEFT JOIN bookings b ON ci.booking_id = b.id
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN stylists s ON b.stylist_id = s.id
      LEFT JOIN services sv ON b.service_id = sv.id
      ORDER BY ci.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/today', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ci.*, c.name as client_name, s.name as stylist_name, sv.name as service_name,
        b.booking_date, b.start_time, b.end_time, b.total_price
      FROM checkins ci
      LEFT JOIN bookings b ON ci.booking_id = b.id
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN stylists s ON b.stylist_id = s.id
      LEFT JOIN services sv ON b.service_id = sv.id
      WHERE b.booking_date = CURRENT_DATE
      ORDER BY b.start_time ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { booking_id } = req.body;
    const result = await pool.query(
      `INSERT INTO checkins (booking_id, status, checked_in_at)
       VALUES ($1, 'checked_in', NOW()) RETURNING *`,
      [booking_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/start-service', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE checkins SET status = 'in_service', service_started_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Check-in not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/complete', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE checkins SET status = 'completed', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Check-in not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/no-show', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE checkins SET status = 'no_show', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Check-in not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
