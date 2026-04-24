const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stylists', require('./routes/stylists'));
app.use('/api/services', require('./routes/services'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/products', require('./routes/products'));
app.use('/api/waitlist', require('./routes/waitlist'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/loyalty', require('./routes/loyalty'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/giftcards', require('./routes/giftcards'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/performance', require('./routes/performance'));
app.use('/api/tips', require('./routes/tips'));
app.use('/api/checkin', require('./routes/checkin'));
app.use('/api/memberships', require('./routes/memberships'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/payroll', require('./routes/payroll'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
