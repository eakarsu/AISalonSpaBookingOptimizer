const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// GET all bookings with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, stylist_id, client_id, status, date } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];
    let idx = 1;

    if (stylist_id) { conditions.push(`b.stylist_id = $${idx++}`); params.push(stylist_id); }
    if (client_id) { conditions.push(`b.client_id = $${idx++}`); params.push(client_id); }
    if (status) { conditions.push(`b.status = $${idx++}`); params.push(status); }
    if (date) { conditions.push(`b.booking_date = $${idx++}`); params.push(date); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await pool.query(`SELECT COUNT(*) FROM bookings b ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(`
      SELECT b.*, c.name as client_name, s.name as stylist_name, sv.name as service_name
      FROM bookings b
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN stylists s ON b.stylist_id = s.id
      LEFT JOIN services sv ON b.service_id = sv.id
      ${where}
      ORDER BY b.booking_date DESC, b.start_time DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, parseInt(limit), offset]);

    res.json({
      data: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET calendar view by date
router.get('/calendar/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const result = await pool.query(`
      SELECT b.*, c.name as client_name, s.name as stylist_name, sv.name as service_name, sv.category
      FROM bookings b
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN stylists s ON b.stylist_id = s.id
      LEFT JOIN services sv ON b.service_id = sv.id
      WHERE b.booking_date = $1
      ORDER BY b.stylist_id, b.start_time ASC
    `, [date]);
    res.json({ bookings: result.rows, date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, c.name as client_name, s.name as stylist_name, sv.name as service_name
      FROM bookings b
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN stylists s ON b.stylist_id = s.id
      LEFT JOIN services sv ON b.service_id = sv.id
      WHERE b.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings - with conflict prevention
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { client_id, stylist_id, service_id, booking_date, start_time, end_time, status, notes, total_price } = req.body;

    if (stylist_id && booking_date && start_time && end_time) {
      const conflict = await pool.query(`
        SELECT id FROM bookings
        WHERE stylist_id = $1 AND booking_date = $2
          AND status NOT IN ('cancelled', 'no_show')
          AND (start_time < $4 AND end_time > $3)
      `, [stylist_id, booking_date, start_time, end_time]);

      if (conflict.rows.length > 0) {
        return res.status(409).json({
          error: 'Booking conflict detected',
          message: `Stylist is already booked from ${start_time} to ${end_time} on ${booking_date}`,
          conflicting_booking_id: conflict.rows[0].id
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO bookings (client_id, stylist_id, service_id, booking_date, start_time, end_time, status, notes, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [client_id, stylist_id, service_id, booking_date, start_time, end_time, status || 'confirmed', notes, total_price]
    );

    // Auto-create commission record
    if (stylist_id && total_price) {
      const COMMISSION_RATE = 0.40;
      const commissionAmount = parseFloat(total_price) * COMMISSION_RATE;
      pool.query(
        `INSERT INTO commissions (stylist_id, booking_id, amount, rate, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [stylist_id, result.rows[0].id, commissionAmount, COMMISSION_RATE]
      ).catch(() => {});
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings/from-recommendation
router.post('/from-recommendation', authMiddleware, async (req, res) => {
  try {
    const { recommendation, client_id, stylist_id, service_id, booking_date } = req.body;
    if (!client_id) return res.status(400).json({ error: 'client_id is required' });

    let date = booking_date || recommendation?.suggested_next_date;
    if (!date) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      date = d.toISOString().split('T')[0];
    }

    let resolvedServiceId = service_id;
    if (!resolvedServiceId && recommendation?.suggested_service) {
      const svcResult = await pool.query(
        `SELECT id FROM services WHERE LOWER(name) LIKE LOWER($1) LIMIT 1`,
        [`%${recommendation.suggested_service}%`]
      );
      if (svcResult.rows.length > 0) resolvedServiceId = svcResult.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO bookings (client_id, stylist_id, service_id, booking_date, status, notes)
       VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *`,
      [client_id, stylist_id || null, resolvedServiceId || null, date,
       `AI rebook recommendation. Priority: ${recommendation?.priority || 'normal'}`]
    );

    res.status(201).json({ booking: result.rows[0], message: 'Booking created from AI recommendation' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { client_id, stylist_id, service_id, booking_date, start_time, end_time, status, notes, total_price } = req.body;
    const result = await pool.query(
      `UPDATE bookings SET client_id=$1, stylist_id=$2, service_id=$3, booking_date=$4, start_time=$5,
       end_time=$6, status=$7, notes=$8, total_price=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [client_id, stylist_id, service_id, booking_date, start_time, end_time, status, notes, total_price, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking deleted', booking: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings/:id/review
router.post('/:id/review', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookingId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const bookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (bookingResult.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    const booking = bookingResult.rows[0];

    // Ensure review columns exist
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_rating FLOAT`).catch(() => {});
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_comment TEXT`).catch(() => {});

    await pool.query(
      `UPDATE bookings SET review_rating = $1, review_comment = $2, updated_at = NOW() WHERE id = $3`,
      [rating, comment || '', bookingId]
    );

    // Update stylist running average
    if (booking.stylist_id) {
      const avgResult = await pool.query(
        `SELECT AVG(review_rating) as avg_rating FROM bookings WHERE stylist_id = $1 AND review_rating IS NOT NULL`,
        [booking.stylist_id]
      );
      const newRating = parseFloat(avgResult.rows[0]?.avg_rating || rating).toFixed(2);
      await pool.query(`UPDATE stylists SET rating = $1 WHERE id = $2`, [newRating, booking.stylist_id]);
    }

    res.json({ message: 'Review submitted', booking_id: bookingId, rating, comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
