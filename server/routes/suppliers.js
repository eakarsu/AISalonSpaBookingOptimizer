const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/orders', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM supplier_orders WHERE supplier_id = $1 ORDER BY order_date DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, contact_person, email, phone, address, product_categories, payment_terms, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO suppliers (name, contact_person, email, phone, address, product_categories, payment_terms, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, contact_person, email, phone, address, product_categories, payment_terms, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, contact_person, email, phone, address, product_categories, payment_terms, notes, status } = req.body;
    const result = await pool.query(
      `UPDATE suppliers SET name=$1, contact_person=$2, email=$3, phone=$4, address=$5,
       product_categories=$6, payment_terms=$7, notes=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [name, contact_person, email, phone, address, product_categories, payment_terms, notes, status || 'active', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const { supplier_id, items, total_amount, order_date, expected_delivery, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO supplier_orders (supplier_id, items, total_amount, order_date, expected_delivery, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [supplier_id, items, total_amount, order_date || new Date(), expected_delivery, status || 'pending', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/orders/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const result = await pool.query(
      `UPDATE supplier_orders SET status=$1, notes=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
