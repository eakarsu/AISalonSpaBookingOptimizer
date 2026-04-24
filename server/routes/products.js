const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY category, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, brand, category, description, price, stock_quantity, suitable_for } = req.body;
    const result = await pool.query(
      `INSERT INTO products (name, brand, category, description, price, stock_quantity, suitable_for)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, brand, category, description, price, stock_quantity, suitable_for]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, brand, category, description, price, stock_quantity, suitable_for } = req.body;
    const result = await pool.query(
      `UPDATE products SET name=$1, brand=$2, category=$3, description=$4, price=$5,
       stock_quantity=$6, suitable_for=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [name, brand, category, description, price, stock_quantity, suitable_for, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted', product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
