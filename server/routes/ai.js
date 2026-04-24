const express = require('express');
const router = express.Router();
const pool = require('../db');
const { queryOpenRouter } = require('../services/openrouter');

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

    const systemPrompt = `You are an AI stylist matching specialist for a salon & spa. Analyze the client's profile and the requested service to recommend the best matching stylists. Provide detailed reasoning for each match. Return your response as structured text with clear sections for each recommended stylist.`;

    const userPrompt = `Client Profile:
- Name: ${client.name}
- Hair Type: ${client.hair_type || 'Not specified'}
- Skin Type: ${client.skin_type || 'Not specified'}
- Preferences: ${client.preferences || 'None specified'}
- Allergies: ${client.allergies || 'None'}

Requested Service: ${service.name} (${service.category})
Description: ${service.description}
Difficulty Level: ${service.difficulty_level}

Available Stylists:
${stylists.map(s => `- ${s.name}: Specialties: ${s.specialties}, Experience: ${s.experience_years} years, Rating: ${s.rating}/5, Hourly Rate: $${s.hourly_rate}`).join('\n')}

Please recommend the top 3 best-matching stylists with detailed reasoning, compatibility score (1-100), and any special notes. Format with clear headers and bullet points.`;

    const aiResponse = await queryOpenRouter(systemPrompt, userPrompt);
    res.json({ recommendation: aiResponse, client, service, stylists_considered: stylists.length });
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

    let stylistInfo = '';
    if (stylist_id) {
      const stylistResult = await pool.query('SELECT * FROM stylists WHERE id = $1', [stylist_id]);
      if (stylistResult.rows.length > 0) {
        const s = stylistResult.rows[0];
        stylistInfo = `Stylist: ${s.name}, Experience: ${s.experience_years} years, Specialties: ${s.specialties}`;
      }
    }

    const client = clientResult.rows[0];
    const service = serviceResult.rows[0];

    // Get historical bookings for similar services
    const historyResult = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_duration,
       COUNT(*) as booking_count
       FROM bookings WHERE service_id = $1 AND status = 'completed'`,
      [service_id]
    );

    const systemPrompt = `You are an AI service duration prediction specialist for a salon & spa. Predict the expected duration for a service based on the client profile, service details, stylist experience, and historical data. Provide a detailed breakdown of time estimates.`;

    const userPrompt = `Service: ${service.name} (Base Duration: ${service.base_duration_min} minutes)
Category: ${service.category}
Difficulty: ${service.difficulty_level}
Description: ${service.description}

Client: ${client?.name || 'Walk-in'}
Hair Type: ${client?.hair_type || 'Unknown'}
Skin Type: ${client?.skin_type || 'Unknown'}
Preferences: ${client?.preferences || 'None'}

${stylistInfo}

Historical Data: Average duration for this service: ${historyResult.rows[0]?.avg_duration ? Math.round(historyResult.rows[0].avg_duration) + ' minutes' : 'No historical data'} (${historyResult.rows[0]?.booking_count || 0} past bookings)

Please predict:
1. Estimated total duration (in minutes)
2. Breakdown by phases (consultation, preparation, service, finishing)
3. Factors that might extend or shorten the service
4. Confidence level of prediction
5. Recommended buffer time`;

    const aiResponse = await queryOpenRouter(systemPrompt, userPrompt);
    res.json({ prediction: aiResponse, service, base_duration: service.base_duration_min });
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

    const systemPrompt = `You are an AI product recommendation specialist for a salon & spa. Recommend the best products based on the client's profile, hair/skin type, and recent services. Provide personalized recommendations with detailed reasoning.`;

    const userPrompt = `Client Profile:
- Name: ${client.name}
- Hair Type: ${client.hair_type || 'Not specified'}
- Skin Type: ${client.skin_type || 'Not specified'}
- Preferences: ${client.preferences || 'None'}
- Allergies: ${client.allergies || 'None'}
${serviceInfo}

Available Products:
${products.map(p => `- ${p.name} by ${p.brand} ($${p.price}): ${p.description} | Category: ${p.category} | Suitable for: ${p.suitable_for}`).join('\n')}

Please recommend the top 5 products with:
1. Product name and why it's recommended
2. How to use it
3. Expected benefits for this client
4. Any precautions given their allergies/sensitivities
5. Value rating (1-5 stars)`;

    const aiResponse = await queryOpenRouter(systemPrompt, userPrompt);
    res.json({ recommendations: aiResponse, client, products_available: products.length });
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
      ORDER BY b.booking_date DESC
      LIMIT 10
    `, [client_id]);

    const client = clientResult.rows[0];
    const bookings = bookingsResult.rows;

    const systemPrompt = `You are an AI rebooking automation specialist for a salon & spa. Analyze the client's booking history to suggest optimal rebooking schedules. Consider service intervals, seasonal factors, and client preferences.`;

    const userPrompt = `Client: ${client.name}
Hair Type: ${client.hair_type || 'Unknown'}
Skin Type: ${client.skin_type || 'Unknown'}
Preferences: ${client.preferences || 'None'}

Booking History (most recent first):
${bookings.length > 0 ? bookings.map(b => `- ${b.booking_date}: ${b.service_name} with ${b.stylist_name} (Status: ${b.status})`).join('\n') : 'No previous bookings'}

Today's Date: ${new Date().toISOString().split('T')[0]}

Please provide:
1. Recommended rebooking schedule for each service type
2. Optimal intervals between appointments
3. Suggested next appointment date and service
4. Seasonal recommendations
5. Personalized rebooking message for the client
6. Priority level (urgent, normal, low) for rebooking`;

    const aiResponse = await queryOpenRouter(systemPrompt, userPrompt);
    res.json({ suggestions: aiResponse, client, booking_history: bookings });
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
      GROUP BY s.id
      ORDER BY upcoming_bookings ASC
    `);

    const waitlist = waitlistResult.rows;
    const stylists = stylistsResult.rows;

    const systemPrompt = `You are an AI waitlist management specialist for a salon & spa. Optimize the waitlist by matching waiting clients with available stylist slots, considering priorities, preferences, and scheduling constraints.`;

    const userPrompt = `Current Waitlist:
${waitlist.length > 0 ? waitlist.map(w => `- ${w.client_name}: wants ${w.service_name} (${w.base_duration_min}min), preferred stylist: ${w.preferred_stylist_name || 'Any'}, preferred date: ${w.preferred_date || 'Flexible'}, priority: ${w.priority}, notes: ${w.notes || 'None'}`).join('\n') : 'Waitlist is empty'}

Available Stylists & Workload:
${stylists.map(s => `- ${s.name}: Specialties: ${s.specialties}, Upcoming bookings: ${s.upcoming_bookings}, Rating: ${s.rating}/5`).join('\n')}

Please provide:
1. Optimized waitlist order with reasoning
2. Suggested stylist-client matches for each waitlist entry
3. Recommended scheduling windows
4. Estimated wait times
5. Actions to reduce wait times
6. Clients who should be prioritized and why`;

    const aiResponse = await queryOpenRouter(systemPrompt, userPrompt);
    res.json({ optimization: aiResponse, waitlist_count: waitlist.length, available_stylists: stylists.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
