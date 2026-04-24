const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY expense_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { category, description, amount, vendor, payment_method, receipt_number, expense_date, is_recurring, recurrence_interval, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO expenses (category, description, amount, vendor, payment_method, receipt_number, expense_date, is_recurring, recurrence_interval, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [category, description, amount, vendor, payment_method, receipt_number, expense_date, is_recurring || false, recurrence_interval, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { category, description, amount, vendor, payment_method, receipt_number, expense_date, is_recurring, recurrence_interval, notes } = req.body;
    const result = await pool.query(
      `UPDATE expenses SET category=$1, description=$2, amount=$3, vendor=$4, payment_method=$5,
       receipt_number=$6, expense_date=$7, is_recurring=$8, recurrence_interval=$9, notes=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [category, description, amount, vendor, payment_method, receipt_number, expense_date, is_recurring, recurrence_interval, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted', expense: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
