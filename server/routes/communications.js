const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cm.*, c.name as client_name
      FROM communications cm
      LEFT JOIN clients c ON cm.client_id = c.id
      ORDER BY cm.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cm.*, c.name as client_name
      FROM communications cm
      LEFT JOIN clients c ON cm.client_id = c.id
      WHERE cm.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Communication not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { client_id, type, subject, message, status, sent_at, campaign_name } = req.body;
    const result = await pool.query(
      `INSERT INTO communications (client_id, type, subject, message, status, sent_at, campaign_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [client_id, type, subject, message, status || 'sent', sent_at || new Date(), campaign_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { client_id, type, subject, message, status, sent_at, campaign_name } = req.body;
    const result = await pool.query(
      `UPDATE communications SET client_id=$1, type=$2, subject=$3, message=$4, status=$5,
       sent_at=$6, campaign_name=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [client_id, type, subject, message, status, sent_at, campaign_name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Communication not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM communications WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Communication not found' });
    res.json({ message: 'Communication deleted', communication: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
