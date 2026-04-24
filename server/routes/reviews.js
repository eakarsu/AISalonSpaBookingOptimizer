const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, c.name as client_name, s.name as stylist_name, sv.name as service_name
      FROM reviews r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN stylists s ON r.stylist_id = s.id
      LEFT JOIN services sv ON r.service_id = sv.id
      ORDER BY r.visit_date DESC, r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, c.name as client_name, s.name as stylist_name, sv.name as service_name
      FROM reviews r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN stylists s ON r.stylist_id = s.id
      LEFT JOIN services sv ON r.service_id = sv.id
      WHERE r.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Review not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { client_id, stylist_id, service_id, rating, comment, visit_date, would_recommend } = req.body;
    const result = await pool.query(
      `INSERT INTO reviews (client_id, stylist_id, service_id, rating, comment, visit_date, would_recommend)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [client_id, stylist_id, service_id, rating, comment, visit_date, would_recommend]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { client_id, stylist_id, service_id, rating, comment, visit_date, would_recommend } = req.body;
    const result = await pool.query(
      `UPDATE reviews SET client_id=$1, stylist_id=$2, service_id=$3, rating=$4, comment=$5,
       visit_date=$6, would_recommend=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [client_id, stylist_id, service_id, rating, comment, visit_date, would_recommend, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Review not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted', review: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
