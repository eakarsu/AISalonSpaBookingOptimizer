const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, c.name as client_name, s.name as stylist_name, sv.name as service_name
      FROM bookings b
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN stylists s ON b.stylist_id = s.id
      LEFT JOIN services sv ON b.service_id = sv.id
      ORDER BY b.booking_date DESC, b.start_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, c.name as client_name, s.name as stylist_name, sv.name as service_name
      FROM bookings b
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN stylists s ON b.stylist_id = s.id
      LEFT JOIN services sv ON b.service_id = sv.id
      WHERE b.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { client_id, stylist_id, service_id, booking_date, start_time, end_time, status, notes, total_price } = req.body;
    const result = await pool.query(
      `INSERT INTO bookings (client_id, stylist_id, service_id, booking_date, start_time, end_time, status, notes, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [client_id, stylist_id, service_id, booking_date, start_time, end_time, status || 'confirmed', notes, total_price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { client_id, stylist_id, service_id, booking_date, start_time, end_time, status, notes, total_price } = req.body;
    const result = await pool.query(
      `UPDATE bookings SET client_id=$1, stylist_id=$2, service_id=$3, booking_date=$4, start_time=$5,
       end_time=$6, status=$7, notes=$8, total_price=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [client_id, stylist_id, service_id, booking_date, start_time, end_time, status, notes, total_price, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking deleted', booking: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
