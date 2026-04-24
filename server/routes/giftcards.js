const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gift_cards ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gift_cards WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gift card not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { code, purchaser_name, purchaser_email, recipient_name, recipient_email, original_amount, remaining_balance, status, expiry_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO gift_cards (code, purchaser_name, purchaser_email, recipient_name, recipient_email, original_amount, remaining_balance, status, expiry_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [code, purchaser_name, purchaser_email, recipient_name, recipient_email, original_amount, remaining_balance || original_amount, status || 'active', expiry_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { code, purchaser_name, purchaser_email, recipient_name, recipient_email, original_amount, remaining_balance, status, expiry_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE gift_cards SET code=$1, purchaser_name=$2, purchaser_email=$3, recipient_name=$4, recipient_email=$5,
       original_amount=$6, remaining_balance=$7, status=$8, expiry_date=$9, notes=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [code, purchaser_name, purchaser_email, recipient_name, recipient_email, original_amount, remaining_balance, status, expiry_date, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gift card not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM gift_cards WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gift card not found' });
    res.json({ message: 'Gift card deleted', gift_card: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
