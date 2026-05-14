const express = require('express');
const router = express.Router();
const pool = require('../db');
const { queryOpenRouter, parseAIJson } = require('../services/openrouter');
const authMiddleware = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

// Apply auth + rate limit to all AI routes
router.use(authMiddleware);
router.use(aiRateLimiter);

// Helper: persist AI result to ai_results table
async function persistAIResult(endpoint, inputData, result, userId) {
  try {
    await pool.query(
      `INSERT INTO ai_results (endpoint, input_data, result, user_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [endpoint, JSON.stringify(inputData), JSON.stringify(result), userId]
    );
  } catch (err) {
    console.error('Failed to persist AI result:', err.message);
  }
}

// AI Stylist Matching
router.post('/stylist-match', async (req, res) => {
  try {
    const { client_id, service_id } = req.body;
    const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [client_id]);
    const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [service_id]);
    const stylistsResult = await pool.query('SELECT * FROM stylists ORDER BY rating DESC');

    if (clientResult.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    if (serviceResult.rows.length === 0) return res.status(404).json({ error: 'Service not found' });

    const client = clientResult.rows[0];
    const service = serviceResult.rows[0];
    const stylists = stylistsResult.rows;

    const systemPrompt = `You are an AI stylist matching specialist for a salon & spa. Return ONLY valid JSON, no markdown.`;
    const userPrompt = `Match the best stylists for this client and service. Return JSON:
{
  "top_matches": [
    {
      "stylist_name": "...",
      "stylist_id": ...,
      "compatibility_score": 85,
      "reasoning": "...",
      "special_notes": "..."
    }
  ],
  "summary": "...",
  "recommendation": "..."
}

Client: ${client.name}, Hair: ${client.hair_type || 'N/A'}, Skin: ${client.skin_type || 'N/A'}, Allergies: ${client.allergies || 'None'}, Preferences: ${client.preferences || 'None'}
Service: ${service.name} (${service.category}), Difficulty: ${service.difficulty_level}
Stylists: ${stylists.map(s => `[id:${s.id}] ${s.name}: ${s.specialties}, ${s.experience_years}yr exp, Rating:${s.rating}`).join('; ')}`;

    const aiText = await queryOpenRouter(systemPrompt, userPrompt);
    let parsed;
    try { parsed = parseAIJson(aiText); } catch (_) { parsed = { summary: aiText, top_matches: [] }; }

    await persistAIResult('stylist-match', { client_id, service_id }, parsed, req.user?.id);
    res.json({ recommendation: parsed, client, service, stylists_considered: stylists.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Service Duration Prediction
router.post('/duration-predict', async (req, res) => {
  try {
    const { client_id, service_id, stylist_id } = req.body;
    const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [client_id]);
    const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [service_id]);

    let stylistInfo = 'Not specified';
    if (stylist_id) {
      const stylistResult = await pool.query('SELECT * FROM stylists WHERE id = $1', [stylist_id]);
      if (stylistResult.rows.length > 0) {
        const s = stylistResult.rows[0];
        stylistInfo = `${s.name}, ${s.experience_years}yr exp, Specialties: ${s.specialties}`;
      }
    }

    const client = clientResult.rows[0];
    const service = serviceResult.rows[0];
    const historyResult = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_duration, COUNT(*) as booking_count
       FROM bookings WHERE service_id = $1 AND status = 'completed'`,
      [service_id]
    );

    const systemPrompt = `You are an AI service duration prediction specialist. Return ONLY valid JSON, no markdown.`;
    const userPrompt = `Predict duration. Return JSON:
{
  "predicted_duration_min": 90,
  "breakdown": { "consultation": 10, "preparation": 15, "service": 55, "finishing": 10 },
  "factors_extending": ["..."],
  "factors_shortening": ["..."],
  "confidence_level": "high|medium|low",
  "buffer_recommendation_min": 15,
  "summary": "..."
}

Service: ${service?.name} (Base: ${service?.base_duration_min}min), Category: ${service?.category}, Difficulty: ${service?.difficulty_level}
Client: ${client?.name}, Hair: ${client?.hair_type || 'Unknown'}, Skin: ${client?.skin_type || 'Unknown'}
Stylist: ${stylistInfo}
Historical avg: ${historyResult.rows[0]?.avg_duration ? Math.round(historyResult.rows[0].avg_duration) + 'min' : 'No data'} (${historyResult.rows[0]?.booking_count || 0} bookings)`;

    const aiText = await queryOpenRouter(systemPrompt, userPrompt);
    let parsed;
    try { parsed = parseAIJson(aiText); } catch (_) { parsed = { summary: aiText, predicted_duration_min: service?.base_duration_min }; }

    await persistAIResult('duration-predict', { client_id, service_id, stylist_id }, parsed, req.user?.id);
    res.json({ prediction: parsed, service, base_duration: service?.base_duration_min });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Product Recommendation
router.post('/product-recommend', async (req, res) => {
  try {
    const { client_id, service_id } = req.body;
    const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [client_id]);
    const productsResult = await pool.query('SELECT * FROM products WHERE stock_quantity > 0 ORDER BY category');

    let serviceInfo = '';
    if (service_id) {
      const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [service_id]);
      if (serviceResult.rows.length > 0) {
        serviceInfo = `Recent/Planned Service: ${serviceResult.rows[0].name} (${serviceResult.rows[0].category})`;
      }
    }

    const client = clientResult.rows[0];
    const products = productsResult.rows;

    const systemPrompt = `You are an AI product recommendation specialist for a salon & spa. Return ONLY valid JSON, no markdown.`;
    const userPrompt = `Recommend products. Return JSON:
{
  "recommendations": [
    {
      "product_name": "...",
      "reason": "...",
      "usage": "...",
      "benefits": "...",
      "precautions": "...",
      "value_rating": 5
    }
  ],
  "summary": "..."
}

Client: ${client?.name}, Hair: ${client?.hair_type || 'N/A'}, Skin: ${client?.skin_type || 'N/A'}, Allergies: ${client?.allergies || 'None'}
${serviceInfo}
Products: ${products.slice(0, 30).map(p => `${p.name} by ${p.brand} ($${p.price}): ${p.description} | ${p.category} | For: ${p.suitable_for}`).join('\n')}`;

    const aiText = await queryOpenRouter(systemPrompt, userPrompt);
    let parsed;
    try { parsed = parseAIJson(aiText); } catch (_) { parsed = { summary: aiText, recommendations: [] }; }

    await persistAIResult('product-recommend', { client_id, service_id }, parsed, req.user?.id);
    res.json({ recommendations: parsed, client, products_available: products.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Rebooking Automation
router.post('/rebook-suggest', async (req, res) => {
  try {
    const { client_id } = req.body;
    const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [client_id]);
    const bookingsResult = await pool.query(`
      SELECT b.*, s.name as stylist_name, sv.name as service_name, sv.category
      FROM bookings b
      LEFT JOIN stylists s ON b.stylist_id = s.id
      LEFT JOIN services sv ON b.service_id = sv.id
      WHERE b.client_id = $1
      ORDER BY b.booking_date DESC LIMIT 10
    `, [client_id]);

    const client = clientResult.rows[0];
    const bookings = bookingsResult.rows;

    const systemPrompt = `You are an AI rebooking automation specialist for a salon & spa. Return ONLY valid JSON, no markdown.`;
    const userPrompt = `Analyze booking history and suggest rebooking. Return JSON:
{
  "suggested_next_date": "YYYY-MM-DD",
  "suggested_service": "...",
  "priority": "urgent|normal|low",
  "optimal_intervals": [{ "service": "...", "interval_weeks": 6 }],
  "seasonal_recommendations": ["..."],
  "personalized_message": "...",
  "schedule": [{ "service": "...", "next_date": "...", "reasoning": "..." }]
}

Client: ${client?.name}, Hair: ${client?.hair_type || 'Unknown'}, Skin: ${client?.skin_type || 'Unknown'}
History: ${bookings.length > 0 ? bookings.map(b => `${b.booking_date}: ${b.service_name} with ${b.stylist_name} (${b.status})`).join('; ') : 'No bookings'}
Today: ${new Date().toISOString().split('T')[0]}`;

    const aiText = await queryOpenRouter(systemPrompt, userPrompt);
    let parsed;
    try { parsed = parseAIJson(aiText); } catch (_) { parsed = { personalized_message: aiText, priority: 'normal' }; }

    await persistAIResult('rebook-suggest', { client_id }, parsed, req.user?.id);
    res.json({ suggestions: parsed, client, booking_history: bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Waitlist Management
router.post('/waitlist-optimize', async (req, res) => {
  try {
    const waitlistResult = await pool.query(`
      SELECT w.*, c.name as client_name, c.preferences, s.name as service_name,
             s.base_duration_min, st.name as preferred_stylist_name
      FROM waitlist w
      LEFT JOIN clients c ON w.client_id = c.id
      LEFT JOIN services s ON w.service_id = s.id
      LEFT JOIN stylists st ON w.preferred_stylist_id = st.id
      WHERE w.status = 'waiting'
      ORDER BY w.priority DESC, w.created_at ASC
    `);

    const stylistsResult = await pool.query(`
      SELECT s.*, COUNT(b.id) as upcoming_bookings
      FROM stylists s
      LEFT JOIN bookings b ON s.id = b.stylist_id AND b.booking_date >= CURRENT_DATE AND b.status = 'confirmed'
      GROUP BY s.id ORDER BY upcoming_bookings ASC
    `);

    const waitlist = waitlistResult.rows;
    const stylists = stylistsResult.rows;

    const systemPrompt = `You are an AI waitlist management specialist. Return ONLY valid JSON, no markdown.`;
    const userPrompt = `Optimize this waitlist. Return JSON:
{
  "optimized_order": [
    {
      "client_name": "...",
      "suggested_stylist": "...",
      "scheduling_window": "...",
      "estimated_wait_days": 3,
      "priority_reason": "..."
    }
  ],
  "actions_to_reduce_wait": ["..."],
  "summary": "..."
}

Waitlist: ${waitlist.map(w => `${w.client_name}: ${w.service_name} (${w.base_duration_min}min), preferred: ${w.preferred_stylist_name || 'Any'}, date: ${w.preferred_date || 'Flex'}, priority: ${w.priority}`).join('; ')}
Stylists: ${stylists.map(s => `${s.name}: ${s.upcoming_bookings} upcoming, Rating:${s.rating}`).join('; ')}`;

    const aiText = await queryOpenRouter(systemPrompt, userPrompt);
    let parsed;
    try { parsed = parseAIJson(aiText); } catch (_) { parsed = { summary: aiText, optimized_order: [] }; }

    await persistAIResult('waitlist-optimize', {}, parsed, req.user?.id);
    res.json({ optimization: parsed, waitlist_count: waitlist.length, available_stylists: stylists.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rebook Queue: run rebook-suggest for all clients with last booking > 30 days
router.post('/rebook-queue', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.name, c.hair_type, c.skin_type,
             MAX(b.booking_date) as last_booking_date,
             COUNT(b.id) as total_bookings
      FROM clients c
      LEFT JOIN bookings b ON c.id = b.client_id AND b.status = 'completed'
      GROUP BY c.id, c.name, c.hair_type, c.skin_type
      HAVING MAX(b.booking_date) < CURRENT_DATE - INTERVAL '30 days'
         OR MAX(b.booking_date) IS NULL
      ORDER BY last_booking_date ASC NULLS FIRST
    `);

    const clients = result.rows;
    const rebookList = [];

    for (const client of clients) {
      const bookingsResult = await pool.query(`
        SELECT b.*, sv.name as service_name FROM bookings b
        LEFT JOIN services sv ON b.service_id = sv.id
        WHERE b.client_id = $1 ORDER BY b.booking_date DESC LIMIT 3
      `, [client.id]);

      const systemPrompt = `You are a salon rebooking AI. Return ONLY valid JSON, no markdown.`;
      const userPrompt = `Quick rebook assessment. Return JSON:
{
  "priority": "urgent|normal|low",
  "suggested_service": "...",
  "days_overdue": 35,
  "outreach_message": "..."
}
Client: ${client.name}, Last booking: ${client.last_booking_date || 'Never'}, Services: ${bookingsResult.rows.map(b => b.service_name).join(', ') || 'None'}`;

      try {
        const aiText = await queryOpenRouter(systemPrompt, userPrompt);
        let suggestion;
        try { suggestion = parseAIJson(aiText); } catch (_) { suggestion = { outreach_message: aiText, priority: 'normal' }; }
        rebookList.push({ client, ...suggestion });
      } catch (_) {
        rebookList.push({ client, priority: 'normal', outreach_message: `Time to rebook ${client.name}!` });
      }
    }

    await persistAIResult('rebook-queue', {}, { count: rebookList.length }, req.user?.id);
    res.json({ rebook_queue: rebookList, total: rebookList.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SMS Reminder Text Generator
router.post('/reminder-message', async (req, res) => {
  try {
    const { booking_id } = req.body;
    const result = await pool.query(`
      SELECT b.*, c.name as client_name, c.preferences, s.name as stylist_name, sv.name as service_name
      FROM bookings b
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN stylists s ON b.stylist_id = s.id
      LEFT JOIN services sv ON b.service_id = sv.id
      WHERE b.id = $1
    `, [booking_id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    const booking = result.rows[0];

    const systemPrompt = `You are an AI that writes personalized, friendly SMS appointment reminders. Return ONLY valid JSON.`;
    const userPrompt = `Generate a personalized SMS reminder. Return JSON:
{
  "sms_message": "...",
  "character_count": 120,
  "tone": "friendly",
  "includes_cta": true
}
Booking: ${booking.service_name} on ${booking.booking_date} at ${booking.start_time} with ${booking.stylist_name}
Client: ${booking.client_name}, Preferences: ${booking.preferences || 'None'}`;

    const aiText = await queryOpenRouter(systemPrompt, userPrompt);
    let parsed;
    try { parsed = parseAIJson(aiText); } catch (_) { parsed = { sms_message: aiText }; }

    await persistAIResult('reminder-message', { booking_id }, parsed, req.user?.id);
    res.json({ reminder: parsed, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Service Demand Forecast
router.post('/service-demand-forecast', async (req, res) => {
  try {
    const horizon = parseInt(req.body?.horizon_days) || 14;
    const services = await pool.query('SELECT id, name, duration_minutes, price FROM services ORDER BY id LIMIT 30').catch(() => ({ rows: [] }));
    const recent = await pool.query(
      `SELECT date_trunc('day', booking_date) as day, service_id, COUNT(*) as cnt
       FROM bookings
       WHERE booking_date >= NOW() - INTERVAL '60 days'
       GROUP BY 1, 2 ORDER BY 1`
    ).catch(() => ({ rows: [] }));
    const futureBooked = await pool.query(
      `SELECT date_trunc('day', booking_date) as day, service_id, COUNT(*) as cnt
       FROM bookings
       WHERE booking_date BETWEEN NOW() AND NOW() + INTERVAL '${horizon} days'
       GROUP BY 1, 2 ORDER BY 1`
    ).catch(() => ({ rows: [] }));

    const systemPrompt = 'You are a salon demand-forecasting AI. Predict service demand by day and hour, and recommend staffing & promotions. Return ONLY valid JSON.';
    const userPrompt = `Services:\n${JSON.stringify(services.rows)}\n\nLast 60 days bookings:\n${JSON.stringify(recent.rows)}\n\nNext ${horizon} days on the books:\n${JSON.stringify(futureBooked.rows)}\n\nReturn JSON: {forecast:[{date,service_id,predicted_bookings,confidence}], peak_periods:[{date,hour_block,services_in_demand}], soft_periods:[{date,hour_block,recommended_promo}], staffing_recommendations:[{date,hour_block,additional_stylists_needed}], summary}.`;
    const aiText = await queryOpenRouter(systemPrompt, userPrompt);
    let parsed;
    try { parsed = parseAIJson(aiText); } catch (_) { parsed = { raw: aiText }; }
    await persistAIResult('service-demand-forecast', { horizon }, parsed, req.user?.id);
    res.json({ forecast: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Stylist Workload Balance
router.post('/stylist-workload-balance', async (req, res) => {
  try {
    const window = parseInt(req.body?.window_days) || 7;
    const stylists = await pool.query('SELECT id, name, role, commission_rate FROM stylists ORDER BY id').catch(() => ({ rows: [] }));
    const load = await pool.query(
      `SELECT stylist_id, COUNT(*) as bookings, SUM(EXTRACT(EPOCH FROM (end_time - start_time))/60) as minutes_booked
       FROM bookings
       WHERE booking_date BETWEEN NOW() AND NOW() + INTERVAL '${window} days'
       GROUP BY stylist_id`
    ).catch(() => ({ rows: [] }));
    const systemPrompt = 'You are an operations AI that balances workload across stylists. Return ONLY valid JSON.';
    const userPrompt = `Stylists:\n${JSON.stringify(stylists.rows)}\n\nLoad next ${window} days:\n${JSON.stringify(load.rows)}\n\nReturn JSON: {balance_score:0-100, overloaded:[{stylist_id,load_index,recommended_offload:[{appointment_attribute,target_stylist_id}]}], underutilized:[{stylist_id,available_capacity_min,recommended_promotions:[]}], rebalance_actions:[{action,affected_appointments:int,expected_outcome}], notes}.`;
    const aiText = await queryOpenRouter(systemPrompt, userPrompt);
    let parsed;
    try { parsed = parseAIJson(aiText); } catch (_) { parsed = { raw: aiText }; }
    await persistAIResult('stylist-workload-balance', { window }, parsed, req.user?.id);
    res.json({ balance: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Appointment Conflict Detection
router.post('/appointment-conflict-detection', async (req, res) => {
  try {
    const date = req.body?.date || null;
    const params = [];
    let where = '';
    if (date) {
      where = 'WHERE booking_date = $1';
      params.push(date);
    } else {
      where = "WHERE booking_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'";
    }
    const bookings = await pool.query(
      `SELECT id, client_id, stylist_id, service_id, booking_date, start_time, end_time, status FROM bookings ${where} ORDER BY stylist_id, start_time LIMIT 500`,
      params
    ).catch(() => ({ rows: [] }));
    const systemPrompt = 'You are a scheduling-conflict AI. Detect overbookings, back-to-back conflicts, missing buffers, and double-booked stylists. Return ONLY valid JSON.';
    const userPrompt = `Bookings (sorted by stylist, time):\n${JSON.stringify(bookings.rows)}\n\nReturn JSON: {conflicts:[{type:"double_book|insufficient_buffer|stylist_overbooked|resource_clash",severity:"low|medium|high",booking_ids:[],description,suggested_resolution:[{action,outcome}]}], conflict_count:int, healthy_count:int, recommended_buffer_min:int, summary}.`;
    const aiText = await queryOpenRouter(systemPrompt, userPrompt);
    let parsed;
    try { parsed = parseAIJson(aiText); } catch (_) { parsed = { raw: aiText }; }
    await persistAIResult('appointment-conflict-detection', { date }, parsed, req.user?.id);
    res.json({ conflicts: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Commission Optimization
router.post('/commission-optimization', async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI is not configured. Set OPENROUTER_API_KEY to enable this feature.' });
  }
  try {
    const window = parseInt(req.body?.window_days) || 30;
    const target_revenue_lift_pct = req.body?.target_revenue_lift_pct ?? null;
    const stylists = await pool.query('SELECT id, name, role, commission_rate FROM stylists ORDER BY id').catch(() => ({ rows: [] }));
    const services = await pool.query('SELECT id, name, price, duration_minutes FROM services ORDER BY id LIMIT 50').catch(() => ({ rows: [] }));
    const performance = await pool.query(
      `SELECT b.stylist_id, COUNT(*) as bookings, COALESCE(SUM(s.price), 0) as revenue
       FROM bookings b LEFT JOIN services s ON s.id = b.service_id
       WHERE b.booking_date >= NOW() - INTERVAL '${window} days'
       GROUP BY b.stylist_id`
    ).catch(() => ({ rows: [] }));
    const systemPrompt = 'You are a salon compensation strategy AI. Recommend commission tier adjustments to balance retention, motivation, and profitability. Return ONLY valid JSON.';
    const userPrompt = `Stylists:\n${JSON.stringify(stylists.rows)}\n\nServices:\n${JSON.stringify(services.rows)}\n\nLast ${window} days performance:\n${JSON.stringify(performance.rows)}\n\nTarget revenue lift %: ${target_revenue_lift_pct}\n\nReturn JSON: {recommendations:[{stylist_id,current_rate,proposed_rate,rationale,projected_monthly_delta_usd}], structure_options:[{name,description,tiers:[{threshold_revenue,rate}]}], retention_risks:[{stylist_id,risk,mitigation}], summary}.`;
    const aiText = await queryOpenRouter(systemPrompt, userPrompt);
    let parsed;
    try { parsed = parseAIJson(aiText); } catch (_) { parsed = { raw: aiText }; }
    await persistAIResult('commission-optimization', { window, target_revenue_lift_pct }, parsed, req.user?.id);
    res.json({ optimization: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Retail Recommend (combines product-recommend with service context)
router.post('/retail-recommend', async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI is not configured. Set OPENROUTER_API_KEY to enable this feature.' });
  }
  try {
    const { client_id, service_id, booking_id, top_k } = req.body || {};
    const k = parseInt(top_k) || 5;
    const products = await pool.query('SELECT id, name, category, price, sku FROM products ORDER BY id LIMIT 100').catch(() => ({ rows: [] }));
    let client = null;
    if (client_id) {
      const r = await pool.query('SELECT id, name, hair_type, skin_type, preferences FROM clients WHERE id = $1', [client_id]).catch(() => ({ rows: [] }));
      client = r.rows[0] || null;
    }
    let service = null;
    if (service_id) {
      const r = await pool.query('SELECT id, name, description, duration_minutes FROM services WHERE id = $1', [service_id]).catch(() => ({ rows: [] }));
      service = r.rows[0] || null;
    }
    let booking = null;
    if (booking_id) {
      const r = await pool.query('SELECT id, client_id, service_id, stylist_id, booking_date, status FROM bookings WHERE id = $1', [booking_id]).catch(() => ({ rows: [] }));
      booking = r.rows[0] || null;
    }
    const systemPrompt = 'You are a retail upsell AI for salons/spas. Recommend products that complement the booked service and the client profile. Return ONLY valid JSON.';
    const userPrompt = `Client:\n${JSON.stringify(client)}\n\nService:\n${JSON.stringify(service)}\n\nBooking:\n${JSON.stringify(booking)}\n\nProduct catalog:\n${JSON.stringify(products.rows)}\n\nReturn top ${k} JSON: {recommendations:[{product_id,product_name,reason,pitch_for_stylist,confidence:0-1,expected_attach_rate:0-1}], bundle_offers:[{name,product_ids:[],discount_pct,rationale}], summary}.`;
    const aiText = await queryOpenRouter(systemPrompt, userPrompt);
    let parsed;
    try { parsed = parseAIJson(aiText); } catch (_) { parsed = { raw: aiText }; }
    await persistAIResult('retail-recommend', { client_id, service_id, booking_id, top_k: k }, parsed, req.user?.id);
    res.json({ recommendations: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
