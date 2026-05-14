const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ai_results table for persisting AI responses
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        endpoint VARCHAR(100) NOT NULL,
        input_data JSONB,
        result JSONB,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // commissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS commissions (
        id SERIAL PRIMARY KEY,
        stylist_id INTEGER REFERENCES stylists(id) ON DELETE SET NULL,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
        amount NUMERIC(10,2) NOT NULL,
        rate NUMERIC(5,4) DEFAULT 0.40,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add review columns to bookings
    await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_rating FLOAT`);
    await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_comment TEXT`);

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ai_results_endpoint ON ai_results(endpoint)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ai_results_user ON ai_results(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_commissions_stylist ON commissions(stylist_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_commissions_booking ON commissions(booking_id)`);

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = migrate;
