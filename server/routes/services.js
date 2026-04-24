const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services ORDER BY category, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, description, base_duration_min, price, difficulty_level } = req.body;
    const result = await pool.query(
      `INSERT INTO services (name, category, description, base_duration_min, price, difficulty_level)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, category, description, base_duration_min, price, difficulty_level]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, description, base_duration_min, price, difficulty_level } = req.body;
    const result = await pool.query(
      `UPDATE services SET name=$1, category=$2, description=$3, base_duration_min=$4,
       price=$5, difficulty_level=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
      [name, category, description, base_duration_min, price, difficulty_level, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted', service: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
