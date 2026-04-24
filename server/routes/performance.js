const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.name, s.specialties, s.rating, s.experience_years, s.hourly_rate,
        COALESCE(b.total_bookings, 0) as total_bookings,
        COALESCE(b.total_revenue, 0) as total_revenue,
        COALESCE(b.clients_served, 0) as clients_served,
        COALESCE(r.avg_review_rating, 0) as avg_review_rating,
        COALESCE(r.review_count, 0) as review_count
      FROM stylists s
      LEFT JOIN (
        SELECT stylist_id, COUNT(*) as total_bookings,
          SUM(total_price) as total_revenue,
          COUNT(DISTINCT client_id) as clients_served
        FROM bookings GROUP BY stylist_id
      ) b ON s.id = b.stylist_id
      LEFT JOIN (
        SELECT stylist_id, AVG(rating) as avg_review_rating, COUNT(*) as review_count
        FROM reviews GROUP BY stylist_id
      ) r ON s.id = r.stylist_id
      ORDER BY total_revenue DESC NULLS LAST
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const stylist = await pool.query('SELECT * FROM stylists WHERE id = $1', [req.params.id]);
    if (stylist.rows.length === 0) return res.status(404).json({ error: 'Stylist not found' });

    const bookings = await pool.query(`
      SELECT b.*, c.name as client_name, sv.name as service_name, sv.category
      FROM bookings b
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN services sv ON b.service_id = sv.id
      WHERE b.stylist_id = $1 ORDER BY b.booking_date DESC LIMIT 20
    `, [req.params.id]);

    const revenueByService = await pool.query(`
      SELECT sv.name, sv.category, COUNT(*) as booking_count, SUM(b.total_price) as revenue
      FROM bookings b LEFT JOIN services sv ON b.service_id = sv.id
      WHERE b.stylist_id = $1 GROUP BY sv.name, sv.category ORDER BY revenue DESC
    `, [req.params.id]);

    res.json({
      stylist: stylist.rows[0],
      recent_bookings: bookings.rows,
      revenue_by_service: revenueByService.rows
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
