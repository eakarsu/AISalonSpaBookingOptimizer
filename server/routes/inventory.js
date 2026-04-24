const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT il.*, p.name as product_name
      FROM inventory_log il
      LEFT JOIN products p ON il.product_id = p.id
      ORDER BY il.transaction_date DESC, il.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT il.*, p.name as product_name
      FROM inventory_log il
      LEFT JOIN products p ON il.product_id = p.id
      WHERE il.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inventory log not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { product_id, transaction_type, quantity, unit_cost, total_cost, supplier, reference_number, notes, transaction_date } = req.body;
    const result = await pool.query(
      `INSERT INTO inventory_log (product_id, transaction_type, quantity, unit_cost, total_cost, supplier, reference_number, notes, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [product_id, transaction_type, quantity, unit_cost, total_cost, supplier, reference_number, notes, transaction_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { product_id, transaction_type, quantity, unit_cost, total_cost, supplier, reference_number, notes, transaction_date } = req.body;
    const result = await pool.query(
      `UPDATE inventory_log SET product_id=$1, transaction_type=$2, quantity=$3, unit_cost=$4, total_cost=$5,
       supplier=$6, reference_number=$7, notes=$8, transaction_date=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [product_id, transaction_type, quantity, unit_cost, total_cost, supplier, reference_number, notes, transaction_date, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inventory log not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM inventory_log WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inventory log not found' });
    res.json({ message: 'Inventory log deleted', inventory_log: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
