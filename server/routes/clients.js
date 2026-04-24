const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, preferences, hair_type, skin_type, allergies, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO clients (name, email, phone, preferences, hair_type, skin_type, allergies, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, email, phone, preferences, hair_type, skin_type, allergies, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, preferences, hair_type, skin_type, allergies, notes } = req.body;
    const result = await pool.query(
      `UPDATE clients SET name=$1, email=$2, phone=$3, preferences=$4, hair_type=$5,
       skin_type=$6, allergies=$7, notes=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [name, email, phone, preferences, hair_type, skin_type, allergies, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Client deleted', client: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
