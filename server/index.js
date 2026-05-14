const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });

const migrate = require('./migrate');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
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

// Run migrations on startup
migrate().catch((err) => console.error('Migration warning:', err.message));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// AI feature mount: service-bundling
app.use('/api/ai/service-bundling', require('./routes/ai-service-bundling'));
// === Batch 07 Gaps & Frontend Mounts ===
app.use('/api/gap-no-servicedemandforecast-busytime-prediction', require('./routes/gap-no-servicedemandforecast-busytime-prediction'));
app.use('/api/gap-no-stylistworkloadbalance', require('./routes/gap-no-stylistworkloadbalance'));
app.use('/api/gap-no-commissionoptimization', require('./routes/gap-no-commissionoptimization'));
app.use('/api/gap-no-retailrecommend-product-to-add-to-service', require('./routes/gap-no-retailrecommend-product-to-add-to-service'));
app.use('/api/gap-no-appointmentconflictdetection', require('./routes/gap-no-appointmentconflictdetection'));
app.use('/api/gap-no-noshow-prediction', require('./routes/gap-no-noshow-prediction'));
app.use('/api/gap-no-public-online-booking-widget-api', require('./routes/gap-no-public-online-booking-widget-api'));
app.use('/api/gap-no-automated-reminder-smsemail-communication', require('./routes/gap-no-automated-reminder-smsemail-communication'));
app.use('/api/gap-no-supplier-reorder-automation', require('./routes/gap-no-supplier-reorder-automation'));
app.use('/api/gap-no-staff-absence-coverage-planning', require('./routes/gap-no-staff-absence-coverage-planning'));
app.use('/api/gap-no-payment-processor-integration', require('./routes/gap-no-payment-processor-integration'));
app.use('/api/gap-no-pos-hardware-integration', require('./routes/gap-no-pos-hardware-integration'));
// === End Batch 07 ===
