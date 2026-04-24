const express = require('express');
const router = express.Router();
const pool = require('../db');

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

module.exports = router;
