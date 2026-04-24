const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM promotions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM promotions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Promotion not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, discount_type, discount_value, applicable_services, start_date, end_date, min_purchase, max_uses, status, promo_code } = req.body;
    const result = await pool.query(
      `INSERT INTO promotions (name, description, discount_type, discount_value, applicable_services, start_date, end_date, min_purchase, max_uses, status, promo_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, description, discount_type, discount_value, applicable_services, start_date, end_date, min_purchase, max_uses, status || 'active', promo_code]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, discount_type, discount_value, applicable_services, start_date, end_date, min_purchase, max_uses, status, promo_code } = req.body;
    const result = await pool.query(
      `UPDATE promotions SET name=$1, description=$2, discount_type=$3, discount_value=$4,
       applicable_services=$5, start_date=$6, end_date=$7, min_purchase=$8, max_uses=$9,
       status=$10, promo_code=$11, updated_at=NOW() WHERE id=$12 RETURNING *`,
      [name, description, discount_type, discount_value, applicable_services, start_date, end_date, min_purchase, max_uses, status, promo_code, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Promotion not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM promotions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Promotion not found' });
    res.json({ message: 'Promotion deleted', promotion: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
