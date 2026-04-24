const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM bookings) as total_bookings,
        (SELECT COALESCE(SUM(total_price), 0) FROM bookings) as total_revenue,
        (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM bookings WHERE rating IS NOT NULL) as avg_rating
    `);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/revenue-by-service', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sv.name as service_name, COUNT(b.id) as total_bookings,
        COALESCE(SUM(b.total_price), 0) as total_revenue
      FROM bookings b
      LEFT JOIN services sv ON b.service_id = sv.id
      GROUP BY sv.name
      ORDER BY total_revenue DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/top-stylists', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.name as stylist_name, COUNT(b.id) as total_bookings,
        COALESCE(ROUND(AVG(b.rating)::numeric, 2), 0) as avg_rating,
        COALESCE(SUM(b.total_price), 0) as total_revenue
      FROM bookings b
      LEFT JOIN stylists s ON b.stylist_id = s.id
      GROUP BY s.name
      ORDER BY total_bookings DESC, avg_rating DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/popular-services', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sv.name as service_name, COUNT(b.id) as times_booked,
        COALESCE(SUM(b.total_price), 0) as total_revenue
      FROM bookings b
      LEFT JOIN services sv ON b.service_id = sv.id
      GROUP BY sv.name
      ORDER BY times_booked DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/client-retention', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.name as client_name, COUNT(b.id) as total_bookings,
        MIN(b.booking_date) as first_booking, MAX(b.booking_date) as last_booking,
        COALESCE(SUM(b.total_price), 0) as total_spent
      FROM bookings b
      LEFT JOIN clients c ON b.client_id = c.id
      GROUP BY c.name
      HAVING COUNT(b.id) > 1
      ORDER BY total_bookings DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
