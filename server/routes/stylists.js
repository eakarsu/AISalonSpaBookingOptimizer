const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Get all stylists
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stylists ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single stylist
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stylists WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Stylist not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create stylist
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, specialties, experience_years, rating, bio, availability, hourly_rate } = req.body;
    const result = await pool.query(
      `INSERT INTO stylists (name, email, phone, specialties, experience_years, rating, bio, availability, hourly_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, email, phone, specialties, experience_years, rating, bio, availability || '{}', hourly_rate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update stylist
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, specialties, experience_years, rating, bio, availability, hourly_rate } = req.body;
    const result = await pool.query(
      `UPDATE stylists SET name=$1, email=$2, phone=$3, specialties=$4, experience_years=$5,
       rating=$6, bio=$7, availability=$8, hourly_rate=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [name, email, phone, specialties, experience_years, rating, bio, availability || '{}', hourly_rate, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Stylist not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete stylist
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM stylists WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Stylist not found' });
    res.json({ message: 'Stylist deleted', stylist: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stylists/:id/commissions - commission earnings
router.get('/:id/commissions', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const stylistId = req.params.id;

    // Ensure commissions table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS commissions (
        id SERIAL PRIMARY KEY,
        stylist_id INTEGER REFERENCES stylists(id),
        booking_id INTEGER REFERENCES bookings(id),
        amount NUMERIC(10,2) NOT NULL,
        rate NUMERIC(5,4) DEFAULT 0.40,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM commissions WHERE stylist_id = $1', [stylistId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(`
      SELECT c.*, b.booking_date, b.total_price, b.service_id,
             sv.name as service_name, cl.name as client_name
      FROM commissions c
      LEFT JOIN bookings b ON c.booking_id = b.id
      LEFT JOIN services sv ON b.service_id = sv.id
      LEFT JOIN clients cl ON b.client_id = cl.id
      WHERE c.stylist_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `, [stylistId, parseInt(limit), offset]);

    const totalEarnings = await pool.query(
      'SELECT SUM(amount) as total FROM commissions WHERE stylist_id = $1', [stylistId]
    );

    res.json({
      data: result.rows,
      total_earnings: parseFloat(totalEarnings.rows[0]?.total || 0).toFixed(2),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
