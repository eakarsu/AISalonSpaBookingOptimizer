const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || '';
  if (password.length < 12 || password.length > 1024) throw new Error('DEMO_PASSWORD must contain 12-1024 characters');
  return password;
}

async function seed() {
  console.log('🌱 Starting database seed...');

  // Drop tables in order
  await pool.query(`
    DROP TABLE IF EXISTS payroll CASCADE;
    DROP TABLE IF EXISTS supplier_orders CASCADE;
    DROP TABLE IF EXISTS suppliers CASCADE;
    DROP TABLE IF EXISTS memberships CASCADE;
    DROP TABLE IF EXISTS membership_plans CASCADE;
    DROP TABLE IF EXISTS checkins CASCADE;
    DROP TABLE IF EXISTS tips CASCADE;
    DROP TABLE IF EXISTS communications CASCADE;
    DROP TABLE IF EXISTS expenses CASCADE;
    DROP TABLE IF EXISTS gift_cards CASCADE;
    DROP TABLE IF EXISTS loyalty_points CASCADE;
    DROP TABLE IF EXISTS inventory_log CASCADE;
    DROP TABLE IF EXISTS promotions CASCADE;
    DROP TABLE IF EXISTS reviews CASCADE;
    DROP TABLE IF EXISTS schedules CASCADE;
    DROP TABLE IF EXISTS waitlist CASCADE;
    DROP TABLE IF EXISTS bookings CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS services CASCADE;
    DROP TABLE IF EXISTS clients CASCADE;
    DROP TABLE IF EXISTS stylists CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);

  // Create tables
  await pool.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'staff',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE stylists (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      specialties TEXT,
      experience_years INTEGER DEFAULT 0,
      rating DECIMAL(3,2) DEFAULT 5.00,
      bio TEXT,
      availability JSONB DEFAULT '{}',
      hourly_rate DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE clients (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      preferences TEXT,
      hair_type VARCHAR(100),
      skin_type VARCHAR(100),
      allergies TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE services (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      description TEXT,
      base_duration_min INTEGER DEFAULT 30,
      price DECIMAL(10,2) DEFAULT 0,
      difficulty_level VARCHAR(50) DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      brand VARCHAR(255),
      category VARCHAR(100),
      description TEXT,
      price DECIMAL(10,2) DEFAULT 0,
      stock_quantity INTEGER DEFAULT 0,
      suitable_for TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE bookings (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      stylist_id INTEGER REFERENCES stylists(id) ON DELETE SET NULL,
      service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
      booking_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME,
      status VARCHAR(50) DEFAULT 'confirmed',
      notes TEXT,
      total_price DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE waitlist (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
      preferred_stylist_id INTEGER REFERENCES stylists(id) ON DELETE SET NULL,
      preferred_date DATE,
      preferred_time TIME,
      priority VARCHAR(20) DEFAULT 'medium',
      notes TEXT,
      status VARCHAR(50) DEFAULT 'waiting',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE reviews (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      stylist_id INTEGER REFERENCES stylists(id) ON DELETE SET NULL,
      service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      visit_date DATE,
      would_recommend BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE promotions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      discount_type VARCHAR(50),
      discount_value DECIMAL(10,2),
      applicable_services TEXT,
      start_date DATE,
      end_date DATE,
      min_purchase DECIMAL(10,2),
      max_uses INTEGER,
      current_uses INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      promo_code VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE inventory_log (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      transaction_type VARCHAR(50),
      quantity INTEGER,
      unit_cost DECIMAL(10,2),
      total_cost DECIMAL(10,2),
      supplier VARCHAR(255),
      reference_number VARCHAR(100),
      notes TEXT,
      transaction_date DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE loyalty_points (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      points_earned INTEGER DEFAULT 0,
      points_redeemed INTEGER DEFAULT 0,
      balance INTEGER DEFAULT 0,
      source VARCHAR(100),
      reference_id INTEGER,
      description TEXT,
      transaction_date DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE gift_cards (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE,
      purchaser_name VARCHAR(255),
      purchaser_email VARCHAR(255),
      recipient_name VARCHAR(255),
      recipient_email VARCHAR(255),
      original_amount DECIMAL(10,2),
      remaining_balance DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'active',
      expiry_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE expenses (
      id SERIAL PRIMARY KEY,
      category VARCHAR(100),
      description TEXT,
      amount DECIMAL(10,2),
      vendor VARCHAR(255),
      payment_method VARCHAR(50),
      receipt_number VARCHAR(100),
      expense_date DATE,
      is_recurring BOOLEAN DEFAULT false,
      recurrence_interval VARCHAR(50),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE communications (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      type VARCHAR(50),
      subject VARCHAR(255),
      message TEXT,
      status VARCHAR(50) DEFAULT 'sent',
      sent_at TIMESTAMP,
      campaign_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE schedules (
      id SERIAL PRIMARY KEY,
      stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
      day_of_week VARCHAR(20) NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      break_start TIME,
      break_end TIME,
      is_available BOOLEAN DEFAULT true,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE tips (
      id SERIAL PRIMARY KEY,
      stylist_id INTEGER REFERENCES stylists(id) ON DELETE SET NULL,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
      booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'cash',
      tip_date DATE DEFAULT CURRENT_DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE checkins (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'checked_in',
      checked_in_at TIMESTAMP,
      service_started_at TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE membership_plans (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      billing_cycle VARCHAR(50) DEFAULT 'monthly',
      included_services TEXT,
      max_bookings_per_month INTEGER,
      discount_percent INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE memberships (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      plan_id INTEGER REFERENCES membership_plans(id) ON DELETE SET NULL,
      plan_name VARCHAR(255),
      start_date DATE NOT NULL,
      end_date DATE,
      price DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'active',
      payment_method VARCHAR(50),
      bookings_used INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE suppliers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      product_categories TEXT,
      payment_terms VARCHAR(100),
      status VARCHAR(50) DEFAULT 'active',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE supplier_orders (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
      items TEXT,
      total_amount DECIMAL(10,2),
      order_date DATE DEFAULT CURRENT_DATE,
      expected_delivery DATE,
      status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE payroll (
      id SERIAL PRIMARY KEY,
      stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
      pay_period_start DATE NOT NULL,
      pay_period_end DATE NOT NULL,
      base_pay DECIMAL(10,2) DEFAULT 0,
      commission_amount DECIMAL(10,2) DEFAULT 0,
      tips_amount DECIMAL(10,2) DEFAULT 0,
      deductions DECIMAL(10,2) DEFAULT 0,
      bonus DECIMAL(10,2) DEFAULT 0,
      total_pay DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('✅ Tables created');

  // Seed Users
  const hashedPassword = await bcrypt.hash(requireDemoPassword(), 10);
  await pool.query(`
    INSERT INTO users (name, email, password_hash, role) VALUES
    ('Admin User', 'admin@salon.com', $1, 'admin'),
    ('Sarah Manager', 'sarah@salon.com', $1, 'manager'),
    ('Front Desk', 'front@salon.com', $1, 'staff')
  `, [hashedPassword]);
  console.log('✅ Users seeded');

  // Seed 16 Stylists
  await pool.query(`
    INSERT INTO stylists (name, email, phone, specialties, experience_years, rating, bio, hourly_rate, availability) VALUES
    ('Emma Thompson', 'emma@salon.com', '555-0101', 'Balayage, Color Correction, Highlights', 12, 4.95, 'Master colorist with expertise in balayage and lived-in color. Trained at Vidal Sassoon Academy.', 85.00, '{"mon":"9-5","tue":"9-5","wed":"9-5","thu":"10-7","fri":"9-6"}'),
    ('Marcus Chen', 'marcus@salon.com', '555-0102', 'Precision Cuts, Fades, Beard Grooming', 8, 4.88, 'Expert barber specializing in modern cuts and classic fades. Known for precise detail work.', 70.00, '{"mon":"10-6","tue":"10-6","wed":"off","thu":"10-7","fri":"10-7","sat":"9-4"}'),
    ('Sophia Rivera', 'sophia@salon.com', '555-0103', 'Keratin Treatment, Deep Conditioning, Scalp Therapy', 10, 4.92, 'Hair health specialist focusing on repair treatments and scalp wellness.', 78.00, '{"mon":"9-5","tue":"off","wed":"9-5","thu":"9-5","fri":"9-5","sat":"10-3"}'),
    ('James Williams', 'james@salon.com', '555-0104', 'Bridal Styling, Updos, Extensions', 15, 4.97, 'Award-winning bridal stylist with features in Vogue and Modern Bride magazine.', 95.00, '{"tue":"10-6","wed":"10-6","thu":"10-7","fri":"10-7","sat":"8-5"}'),
    ('Aisha Patel', 'aisha@salon.com', '555-0105', 'Facials, Chemical Peels, Microdermabrasion', 9, 4.90, 'Licensed esthetician specializing in anti-aging and corrective skincare treatments.', 75.00, '{"mon":"9-5","tue":"9-5","wed":"9-5","thu":"9-5","fri":"9-3"}'),
    ('Diego Morales', 'diego@salon.com', '555-0106', 'Hair Color, Ombre, Fantasy Colors', 6, 4.80, 'Creative colorist known for vibrant fashion colors and seamless ombre techniques.', 65.00, '{"mon":"11-7","tue":"11-7","wed":"off","thu":"11-7","fri":"11-7","sat":"10-5"}'),
    ('Nicole Foster', 'nicole@salon.com', '555-0107', 'Massage Therapy, Hot Stone, Deep Tissue', 11, 4.93, 'Certified massage therapist with specialization in therapeutic and relaxation massage.', 80.00, '{"mon":"9-6","tue":"9-6","wed":"9-6","thu":"off","fri":"9-6","sat":"10-4"}'),
    ('Kenji Tanaka', 'kenji@salon.com', '555-0108', 'Japanese Straightening, Perms, Texture', 14, 4.91, 'Texture specialist trained in Tokyo, expert in Japanese hair straightening techniques.', 88.00, '{"mon":"10-6","tue":"10-6","wed":"10-6","thu":"10-6","fri":"off","sat":"9-3"}'),
    ('Isabella Garcia', 'isabella@salon.com', '555-0109', 'Nail Art, Gel Nails, Manicure, Pedicure', 7, 4.85, 'Creative nail technician specializing in intricate nail art and long-lasting gel applications.', 55.00, '{"mon":"9-5","tue":"9-5","wed":"9-5","thu":"9-5","fri":"9-5","sat":"9-3"}'),
    ('Liam OBrien', 'liam@salon.com', '555-0110', 'Mens Grooming, Straight Razor Shave, Scalp Treatment', 5, 4.78, 'Classic barbering meets modern grooming. Specialist in luxury mens services.', 60.00, '{"mon":"10-7","tue":"10-7","wed":"10-7","thu":"off","fri":"10-7","sat":"9-5"}'),
    ('Priya Sharma', 'priya@salon.com', '555-0111', 'Eyebrow Threading, Waxing, Henna', 8, 4.87, 'Expert in eyebrow shaping and facial hair removal. Certified in henna art.', 50.00, '{"mon":"9-5","tue":"9-5","wed":"off","thu":"9-5","fri":"9-5","sat":"9-4"}'),
    ('Ryan Mitchell', 'ryan@salon.com', '555-0112', 'Blow-dry Styling, Flat Iron, Curling', 4, 4.75, 'Styling expert known for red carpet-ready blowouts and event styling.', 55.00, '{"mon":"11-7","tue":"11-7","wed":"11-7","thu":"11-7","fri":"11-7","sat":"off"}'),
    ('Luna Kim', 'luna@salon.com', '555-0113', 'Korean Skincare, LED Therapy, Hydrafacial', 6, 4.89, 'K-beauty specialist offering cutting-edge Korean skincare treatments and protocols.', 72.00, '{"mon":"9-5","tue":"off","wed":"9-5","thu":"9-5","fri":"9-5","sat":"10-4"}'),
    ('Andre Johnson', 'andre@salon.com', '555-0114', 'Locs, Braids, Natural Hair, Twists', 13, 4.94, 'Natural hair specialist with expertise in protective styling and loc maintenance.', 75.00, '{"mon":"9-6","tue":"9-6","wed":"off","thu":"9-6","fri":"9-6","sat":"9-4"}'),
    ('Olivia Grant', 'olivia@salon.com', '555-0115', 'Lash Extensions, Lash Lift, Brow Lamination', 5, 4.82, 'Certified lash artist specializing in natural-looking volume and classic lash sets.', 60.00, '{"mon":"10-6","tue":"10-6","wed":"10-6","thu":"10-6","fri":"off","sat":"9-3"}'),
    ('Viktor Petrov', 'viktor@salon.com', '555-0116', 'Aromatherapy, Body Wraps, Reflexology', 16, 4.96, 'Master spa therapist with holistic wellness approach. Certified aromatherapist.', 90.00, '{"mon":"9-5","tue":"9-5","wed":"9-5","thu":"off","fri":"9-5","sat":"10-3"}')
  `);
  console.log('✅ 16 Stylists seeded');

  // Seed 16 Clients
  await pool.query(`
    INSERT INTO clients (name, email, phone, preferences, hair_type, skin_type, allergies, notes) VALUES
    ('Jennifer Adams', 'jennifer@email.com', '555-1001', 'Prefers morning appointments, likes organic products', 'Thick, Wavy', 'Combination', 'Sulfate sensitivity', 'VIP client, comes monthly for color'),
    ('Michael Brown', 'michael@email.com', '555-1002', 'Quick service, minimal small talk', 'Straight, Fine', 'Normal', 'None', 'Regular fade every 3 weeks'),
    ('Sarah Kim', 'sarah.k@email.com', '555-1003', 'Loves trying new styles, adventurous', 'Straight, Medium', 'Dry', 'Latex allergy', 'Instagram influencer, photographs well'),
    ('David Martinez', 'david.m@email.com', '555-1004', 'Traditional barber experience', 'Curly, Thick', 'Oily', 'None', 'Prefers Marcus for cuts'),
    ('Amanda White', 'amanda@email.com', '555-1005', 'Relaxing spa experience, soft music', 'Thin, Straight', 'Sensitive', 'Fragrance sensitivity, nut oils', 'Needs hypoallergenic products only'),
    ('Robert Lee', 'robert@email.com', '555-1006', 'Weekend appointments only', 'Coarse, Curly', 'Normal', 'None', 'Loc maintenance client'),
    ('Emily Chen', 'emily.c@email.com', '555-1007', 'Eco-friendly products, vegan options', 'Fine, Straight', 'Dry', 'Parabens, synthetic dyes', 'Prefers sustainable salon practices'),
    ('Christopher Jones', 'chris@email.com', '555-1008', 'Luxury experience, premium products', 'Medium, Wavy', 'Normal', 'None', 'Corporate client, monthly grooming'),
    ('Maria Rodriguez', 'maria@email.com', '555-1009', 'Bilingual service (Spanish), family bookings', 'Thick, Curly', 'Combination', 'PPD in hair dye', 'Books for entire family'),
    ('Kevin Nguyen', 'kevin@email.com', '555-1010', 'Modern trends, social media ready', 'Straight, Thick', 'Oily', 'None', 'Wants bold styles for content'),
    ('Rachel Foster', 'rachel@email.com', '555-1011', 'Bride-to-be, needs trial sessions', 'Medium, Wavy', 'Normal', 'Shellac allergy', 'Wedding date: June 2025'),
    ('Thomas Wilson', 'thomas@email.com', '555-1012', 'Sensitive scalp, gentle products', 'Thinning', 'Sensitive', 'Tea tree oil', 'Scalp condition - needs gentle care'),
    ('Lisa Park', 'lisa@email.com', '555-1013', 'K-beauty enthusiast, latest treatments', 'Straight, Fine', 'Combination', 'None', 'Follows Korean skincare routines'),
    ('James Taylor', 'james.t@email.com', '555-1014', 'After-work appointments, efficient service', 'Short, Coarse', 'Normal', 'None', 'Business professional, needs polished look'),
    ('Natasha Ivanova', 'natasha@email.com', '555-1015', 'Dramatic color changes, creative styling', 'Long, Thick', 'Normal', 'Ammonia in color', 'Loves fantasy hair colors'),
    ('Daniel Smith', 'daniel@email.com', '555-1016', 'First-time client, nervous about salons', 'Medium, Straight', 'Dry', 'None', 'Needs patient stylist, new to salon services')
  `);
  console.log('✅ 16 Clients seeded');

  // Seed 18 Services
  await pool.query(`
    INSERT INTO services (name, category, description, base_duration_min, price, difficulty_level) VALUES
    ('Classic Haircut', 'Hair', 'Precision haircut with consultation, shampoo, and style', 45, 55.00, 'easy'),
    ('Balayage Color', 'Hair Color', 'Hand-painted highlights for natural sun-kissed look', 120, 185.00, 'advanced'),
    ('Full Color Service', 'Hair Color', 'Complete root-to-tip color with gloss treatment', 90, 145.00, 'medium'),
    ('Keratin Smoothing Treatment', 'Hair Treatment', 'Professional keratin treatment for frizz-free smooth hair', 150, 250.00, 'advanced'),
    ('Deep Conditioning Treatment', 'Hair Treatment', 'Intensive moisture and repair treatment with steam', 45, 65.00, 'easy'),
    ('Bridal Updo', 'Styling', 'Elaborate bridal hairstyle with trial consultation', 90, 175.00, 'advanced'),
    ('Blowout & Style', 'Styling', 'Professional blow-dry with round brush styling', 40, 50.00, 'easy'),
    ('Classic Facial', 'Skincare', 'Deep cleansing facial with extraction and mask', 60, 95.00, 'medium'),
    ('Hydrafacial', 'Skincare', 'Advanced hydradermabrasion treatment for glowing skin', 45, 175.00, 'medium'),
    ('Chemical Peel', 'Skincare', 'Professional-grade chemical exfoliation for skin renewal', 30, 125.00, 'advanced'),
    ('Swedish Massage', 'Spa', 'Full body relaxation massage with essential oils', 60, 110.00, 'medium'),
    ('Hot Stone Massage', 'Spa', 'Therapeutic massage using heated basalt stones', 75, 135.00, 'medium'),
    ('Gel Manicure', 'Nails', 'Long-lasting gel polish manicure with cuticle care', 45, 45.00, 'easy'),
    ('Luxury Pedicure', 'Nails', 'Full pedicure with exfoliation, mask, and massage', 60, 65.00, 'easy'),
    ('Lash Extension - Classic', 'Lashes', 'Individual classic lash extensions for natural look', 90, 150.00, 'advanced'),
    ('Brow Lamination', 'Brows', 'Brow restructuring for fuller, feathered look', 30, 55.00, 'medium'),
    ('Mens Grooming Package', 'Mens', 'Haircut, beard trim, and hot towel treatment', 60, 75.00, 'medium'),
    ('Aromatherapy Body Wrap', 'Spa', 'Detoxifying body wrap with aromatherapy session', 90, 145.00, 'medium')
  `);
  console.log('✅ 18 Services seeded');

  // Seed 18 Products
  await pool.query(`
    INSERT INTO products (name, brand, category, description, price, stock_quantity, suitable_for) VALUES
    ('Moroccan Oil Treatment', 'Moroccanoil', 'Hair Oil', 'Argan oil-infused treatment for shine and softness', 34.00, 45, 'All hair types, especially dry and frizzy'),
    ('Purple Shampoo', 'Olaplex', 'Shampoo', 'Toning shampoo for blonde and highlighted hair', 28.00, 30, 'Blonde, silver, and highlighted hair'),
    ('Bond Repair Treatment', 'Olaplex', 'Treatment', 'No.3 Hair Perfector for damaged hair repair', 30.00, 25, 'Damaged, color-treated hair'),
    ('Hydrating Curl Cream', 'DevaCurl', 'Styling', 'Moisture-rich cream for defined, bouncy curls', 26.00, 35, 'Curly and wavy hair types'),
    ('Heat Protectant Spray', 'CHI', 'Styling', '44 Iron Guard thermal protection spray', 18.00, 50, 'All hair types using heat tools'),
    ('Vitamin C Serum', 'SkinCeuticals', 'Skincare', 'L-Ascorbic acid serum for brightening and anti-aging', 166.00, 15, 'All skin types, anti-aging concern'),
    ('Hyaluronic Acid Moisturizer', 'CeraVe', 'Skincare', 'Lightweight moisturizer with hyaluronic acid', 19.00, 40, 'All skin types, especially dry'),
    ('Retinol Night Cream', 'Drunk Elephant', 'Skincare', 'A-Passioni retinol cream for fine lines and texture', 74.00, 20, 'Mature skin, not for sensitive'),
    ('SPF 50 Sunscreen', 'EltaMD', 'Skincare', 'UV Clear broad-spectrum SPF 50 face sunscreen', 39.00, 35, 'All skin types, daily use'),
    ('Keratin Shampoo', 'Kerastase', 'Shampoo', 'Smoothing shampoo for frizzy, unruly hair', 38.00, 28, 'Frizzy, thick, and coarse hair'),
    ('Scalp Revival Scrub', 'Briogeo', 'Treatment', 'Charcoal micro-exfoliating shampoo for scalp health', 42.00, 22, 'Oily scalp, dandruff-prone'),
    ('Nail Strengthener', 'OPI', 'Nails', 'Nail Envy nail strengthener treatment', 19.00, 60, 'Weak, brittle nails'),
    ('Cuticle Oil', 'CND', 'Nails', 'Solar Oil cuticle and nail treatment', 9.00, 55, 'All nail types, daily maintenance'),
    ('Massage Oil Blend', 'Aveda', 'Spa', 'Calming blue oil balancing body composition', 32.00, 25, 'All skin types, relaxation'),
    ('Lash Growth Serum', 'Grande Cosmetics', 'Lashes', 'GrandeLASH-MD lash enhancing serum', 65.00, 18, 'Thin or sparse lashes'),
    ('Dry Shampoo', 'Living Proof', 'Styling', 'Perfect hair Day dry shampoo for freshness', 26.00, 40, 'All hair types, oily roots'),
    ('Color Depositing Mask', 'Moroccanoil', 'Color Care', 'Color-enhancing hair mask for vibrancy', 30.00, 30, 'Color-treated hair'),
    ('Beard Oil', 'Beardbrand', 'Mens', 'Premium beard oil with tea tree and argan', 25.00, 35, 'All beard types, grooming essential')
  `);
  console.log('✅ 18 Products seeded');

  // Seed 16 Bookings
  await pool.query(`
    INSERT INTO bookings (client_id, stylist_id, service_id, booking_date, start_time, end_time, status, notes, total_price) VALUES
    (1, 1, 2, '2025-03-20', '09:00', '11:00', 'confirmed', 'Regular balayage touchup', 185.00),
    (2, 2, 1, '2025-03-20', '10:00', '10:45', 'confirmed', 'Regular fade appointment', 55.00),
    (3, 6, 3, '2025-03-20', '11:00', '12:30', 'confirmed', 'Wants vivid purple tones', 145.00),
    (4, 2, 17, '2025-03-21', '14:00', '15:00', 'confirmed', 'Beard trim included', 75.00),
    (5, 7, 11, '2025-03-21', '09:00', '10:00', 'confirmed', 'Use fragrance-free oil only', 110.00),
    (6, 14, 1, '2025-03-21', '10:00', '10:45', 'confirmed', 'Loc retwist needed', 55.00),
    (7, 3, 5, '2025-03-22', '09:00', '09:45', 'confirmed', 'Eco-friendly products requested', 65.00),
    (8, 10, 17, '2025-03-22', '11:00', '12:00', 'confirmed', 'Premium grooming package', 75.00),
    (9, 1, 3, '2025-03-22', '13:00', '14:30', 'confirmed', 'PPD-free color required', 145.00),
    (10, 12, 7, '2025-03-23', '14:00', '14:40', 'confirmed', 'Quick blowout for photoshoot', 50.00),
    (11, 4, 6, '2025-03-25', '10:00', '11:30', 'confirmed', 'Bridal trial run', 175.00),
    (12, 3, 4, '2025-03-25', '09:00', '11:30', 'confirmed', 'Sensitive scalp - gentle formula', 250.00),
    (13, 13, 9, '2025-03-26', '11:00', '11:45', 'confirmed', 'First hydrafacial appointment', 175.00),
    (14, 2, 1, '2025-03-26', '16:00', '16:45', 'confirmed', 'After-work appointment', 55.00),
    (15, 6, 2, '2025-03-27', '10:00', '12:00', 'confirmed', 'Fantasy color - galaxy theme', 185.00),
    (1, 5, 8, '2025-03-15', '09:00', '10:00', 'completed', 'Monthly facial', 95.00)
  `);
  console.log('✅ 16 Bookings seeded');

  // Seed 15 Waitlist entries
  await pool.query(`
    INSERT INTO waitlist (client_id, service_id, preferred_stylist_id, preferred_date, preferred_time, priority, notes, status) VALUES
    (1, 4, 3, '2025-04-01', '09:00', 'high', 'Needs keratin before vacation', 'waiting'),
    (3, 2, 1, '2025-04-02', '10:00', 'medium', 'Wants balayage refresh', 'waiting'),
    (5, 11, 7, '2025-03-28', '14:00', 'high', 'Recurring massage - fragrance free', 'waiting'),
    (9, 6, 4, '2025-06-15', '09:00', 'high', 'Wedding updo trial', 'waiting'),
    (10, 3, 6, '2025-04-05', '11:00', 'medium', 'Bold color change for video', 'waiting'),
    (11, 15, 15, '2025-04-10', '10:00', 'high', 'Lash extensions before wedding', 'waiting'),
    (12, 5, 3, '2025-03-30', '09:00', 'high', 'Urgent - severe dryness', 'waiting'),
    (7, 18, 16, '2025-04-03', '13:00', 'medium', 'Wants aromatherapy session', 'waiting'),
    (2, 1, 2, '2025-03-29', '10:00', 'low', 'Regular monthly cut', 'waiting'),
    (13, 10, 5, '2025-04-07', '11:00', 'medium', 'Chemical peel consultation first', 'waiting'),
    (14, 17, 10, '2025-04-01', '17:00', 'medium', 'After-work grooming', 'waiting'),
    (15, 3, 1, '2025-04-12', '10:00', 'low', 'Ammonia-free color only', 'waiting'),
    (16, 1, NULL, '2025-04-01', '10:00', 'low', 'First visit - any available stylist', 'waiting'),
    (6, 1, 14, '2025-04-05', '09:00', 'medium', 'Loc maintenance appointment', 'waiting'),
    (8, 12, 7, '2025-04-08', '11:00', 'medium', 'Monthly hot stone session', 'waiting')
  `);
  console.log('✅ 15 Waitlist entries seeded');

  // Seed 15 Schedules
  await pool.query(`
    INSERT INTO schedules (stylist_id, day_of_week, start_time, end_time, break_start, break_end, is_available, notes) VALUES
    (1, 'Monday', '09:00', '17:00', '12:00', '13:00', true, 'Full day - color appointments preferred'),
    (1, 'Tuesday', '09:00', '17:00', '12:00', '13:00', true, 'Full day available'),
    (1, 'Wednesday', '09:00', '17:00', '12:30', '13:30', true, 'Training session at 4pm'),
    (2, 'Monday', '10:00', '18:00', '13:00', '14:00', true, 'Accepts walk-ins after 3pm'),
    (2, 'Thursday', '10:00', '19:00', '13:00', '13:30', true, 'Extended hours - late appointments'),
    (2, 'Saturday', '09:00', '16:00', '12:00', '12:30', true, 'Busy day - book in advance'),
    (3, 'Monday', '09:00', '17:00', '12:00', '13:00', true, 'Treatment room A reserved'),
    (3, 'Wednesday', '09:00', '17:00', '12:00', '13:00', false, 'Off for continuing education'),
    (4, 'Tuesday', '10:00', '18:00', '13:00', '14:00', true, 'Bridal consultations welcome'),
    (4, 'Saturday', '08:00', '17:00', '12:00', '13:00', true, 'Prime bridal styling day'),
    (5, 'Monday', '09:00', '17:00', '12:00', '12:30', true, 'Facial appointments only'),
    (5, 'Friday', '09:00', '15:00', '11:30', '12:00', true, 'Half day - morning bookings preferred'),
    (6, 'Monday', '11:00', '19:00', '14:00', '15:00', true, 'Late start - creative color block'),
    (7, 'Monday', '09:00', '18:00', '12:30', '13:30', true, 'Massage room B reserved'),
    (8, 'Tuesday', '10:00', '18:00', '13:00', '14:00', true, 'Japanese treatment specialist hours')
  `);
  console.log('✅ 15 Schedules seeded');

  // Seed 16 Reviews
  await pool.query(`
    INSERT INTO reviews (client_id, stylist_id, service_id, rating, comment, visit_date, would_recommend) VALUES
    (1, 1, 2, 5, 'Emma did an incredible balayage! The color is so natural and beautiful. Best colorist I have ever been to.', '2025-03-15', true),
    (2, 2, 1, 5, 'Marcus always gives the perfect fade. Quick, precise, and exactly what I want every time.', '2025-03-10', true),
    (3, 6, 3, 4, 'Diego did a great purple color but it faded a bit faster than expected. Still love the result!', '2025-03-08', true),
    (5, 7, 11, 5, 'Nicole gives the most relaxing massage. She remembered my fragrance sensitivity without me reminding her.', '2025-03-12', true),
    (8, 10, 17, 4, 'Great grooming package. The hot towel treatment was luxurious. Would prefer a bit more beard shaping.', '2025-03-05', true),
    (11, 4, 6, 5, 'James created the most stunning bridal updo! I cried happy tears. Cannot wait for the wedding day.', '2025-02-28', true),
    (13, 13, 9, 5, 'Luna is a K-beauty wizard. My skin is glowing after the hydrafacial. Already booked my next one.', '2025-03-01', true),
    (7, 3, 5, 4, 'Sophia used all eco-friendly products as requested. Hair feels amazing but wish the treatment lasted longer.', '2025-03-03', true),
    (9, 1, 3, 5, 'Emma was so careful with my PPD allergy. Used alternative products and the color is gorgeous.', '2025-02-20', true),
    (4, 2, 17, 5, 'Best barber experience. Marcus combines classic technique with modern style perfectly.', '2025-02-25', true),
    (12, 3, 4, 3, 'Keratin treatment worked well but took much longer than expected. Results are good though.', '2025-02-15', true),
    (6, 14, 1, 5, 'Andre is the best with locs. He takes his time and the results are always perfect.', '2025-03-14', true),
    (10, 12, 7, 4, 'Ryan did a great blowout for my photoshoot. Quick and professional.', '2025-03-09', true),
    (14, 2, 1, 4, 'Good haircut, very efficient. Marcus gets me in and out quickly which I appreciate after work.', '2025-03-07', true),
    (15, 6, 2, 5, 'Diego created the most amazing galaxy-themed hair! It is literal art. Everyone stops me to ask about it.', '2025-02-18', true),
    (1, 5, 8, 5, 'Aisha gives the best facials. My skin has never looked better. Monthly appointment is a must.', '2025-03-15', true)
  `);
  console.log('✅ 16 Reviews seeded');

  // Seed 15 Promotions
  await pool.query(`
    INSERT INTO promotions (name, description, discount_type, discount_value, applicable_services, start_date, end_date, min_purchase, max_uses, current_uses, status, promo_code) VALUES
    ('Spring Color Special', '20% off all hair color services this spring', 'percentage', 20.00, 'Hair Color', '2025-03-01', '2025-05-31', 100.00, 100, 23, 'active', 'SPRING20'),
    ('New Client Welcome', '$25 off your first visit', 'fixed', 25.00, 'All Services', '2025-01-01', '2025-12-31', 50.00, 500, 45, 'active', 'WELCOME25'),
    ('Bridal Package Deal', '15% off bridal services when booking 3+', 'percentage', 15.00, 'Styling, Hair Color', '2025-01-01', '2025-12-31', 200.00, 50, 8, 'active', 'BRIDE15'),
    ('Spa Day Bundle', '$30 off when combining massage and facial', 'fixed', 30.00, 'Spa, Skincare', '2025-03-15', '2025-06-15', 150.00, 75, 12, 'active', 'SPADAY30'),
    ('Student Discount', '10% off all services with valid student ID', 'percentage', 10.00, 'All Services', '2025-01-01', '2025-12-31', 0.00, 200, 67, 'active', 'STUDENT10'),
    ('Referral Reward', '$20 off for referring a new client', 'fixed', 20.00, 'All Services', '2025-01-01', '2025-12-31', 0.00, 1000, 89, 'active', 'REFER20'),
    ('Birthday Special', '25% off during your birthday month', 'percentage', 25.00, 'All Services', '2025-01-01', '2025-12-31', 0.00, 500, 34, 'active', 'BDAY25'),
    ('Flash Friday', '15% off all services every Friday', 'percentage', 15.00, 'All Services', '2025-03-01', '2025-04-30', 0.00, 200, 56, 'active', 'FLASH15'),
    ('Keratin Season', '$50 off keratin smoothing treatment', 'fixed', 50.00, 'Hair Treatment', '2025-04-01', '2025-06-30', 200.00, 30, 0, 'active', 'KERATIN50'),
    ('Mens Monday', '20% off mens grooming on Mondays', 'percentage', 20.00, 'Mens', '2025-01-01', '2025-12-31', 0.00, 100, 28, 'active', 'MENMON20'),
    ('Lash & Brow Combo', '$15 off lash and brow services together', 'fixed', 15.00, 'Lashes, Brows', '2025-03-01', '2025-05-31', 80.00, 50, 11, 'active', 'LASHBROW'),
    ('Holiday Gift Card Bonus', 'Buy $100 gift card, get $20 bonus', 'fixed', 20.00, 'Gift Cards', '2025-11-15', '2025-12-31', 100.00, 200, 0, 'active', 'GIFTBONUS'),
    ('Summer Skin Prep', '10% off chemical peels and hydrafacials', 'percentage', 10.00, 'Skincare', '2025-05-01', '2025-07-31', 100.00, 60, 0, 'active', 'SUMMER10'),
    ('Loyalty VIP', '30% off for clients with 500+ loyalty points', 'percentage', 30.00, 'All Services', '2025-01-01', '2025-12-31', 0.00, 100, 5, 'active', 'VIP30'),
    ('Winter Warmup', '$20 off hot stone massage in winter', 'fixed', 20.00, 'Spa', '2025-01-01', '2025-03-31', 100.00, 40, 18, 'expired', 'WINTER20')
  `);
  console.log('✅ 15 Promotions seeded');

  // Seed 15 Inventory Log entries
  await pool.query(`
    INSERT INTO inventory_log (product_id, transaction_type, quantity, unit_cost, total_cost, supplier, reference_number, notes, transaction_date) VALUES
    (1, 'restock', 20, 18.00, 360.00, 'Moroccanoil Direct', 'PO-2025-001', 'Monthly restock order', '2025-03-01'),
    (2, 'restock', 15, 14.00, 210.00, 'Olaplex Wholesale', 'PO-2025-002', 'Quarterly shampoo order', '2025-03-01'),
    (3, 'sale', -3, 30.00, 90.00, NULL, 'INV-1234', 'Retail sale to client', '2025-03-05'),
    (6, 'restock', 10, 90.00, 900.00, 'SkinCeuticals Pro', 'PO-2025-003', 'Premium skincare restock', '2025-03-02'),
    (5, 'sale', -5, 18.00, 90.00, NULL, 'INV-1235', 'Sold during styling sessions', '2025-03-08'),
    (12, 'restock', 30, 10.00, 300.00, 'OPI Professional', 'PO-2025-004', 'Nail supplies quarterly order', '2025-03-03'),
    (14, 'restock', 12, 17.00, 204.00, 'Aveda Supply', 'PO-2025-005', 'Massage oil restock', '2025-03-04'),
    (4, 'sale', -2, 26.00, 52.00, NULL, 'INV-1236', 'Client purchase after curly service', '2025-03-10'),
    (7, 'restock', 25, 10.00, 250.00, 'CeraVe Professional', 'PO-2025-006', 'Moisturizer bulk order', '2025-03-06'),
    (10, 'sale', -4, 38.00, 152.00, NULL, 'INV-1237', 'Post-keratin retail sales', '2025-03-12'),
    (15, 'restock', 8, 35.00, 280.00, 'Grande Cosmetics', 'PO-2025-007', 'Lash serum restock', '2025-03-07'),
    (18, 'sale', -3, 25.00, 75.00, NULL, 'INV-1238', 'Mens grooming product sales', '2025-03-14'),
    (11, 'waste', -1, 42.00, 42.00, NULL, 'WA-001', 'Expired product disposed', '2025-03-09'),
    (16, 'restock', 20, 13.00, 260.00, 'Living Proof Dist', 'PO-2025-008', 'Dry shampoo popular item restock', '2025-03-11'),
    (9, 'adjustment', 5, 39.00, 195.00, NULL, 'ADJ-001', 'Inventory count correction', '2025-03-13')
  `);
  console.log('✅ 15 Inventory entries seeded');

  // Seed 16 Loyalty Points entries
  await pool.query(`
    INSERT INTO loyalty_points (client_id, points_earned, points_redeemed, balance, source, description, transaction_date) VALUES
    (1, 185, 0, 185, 'booking', 'Balayage Color appointment', '2025-03-15'),
    (1, 95, 0, 280, 'booking', 'Classic Facial appointment', '2025-03-15'),
    (2, 55, 0, 55, 'booking', 'Classic Haircut appointment', '2025-03-10'),
    (3, 145, 0, 145, 'booking', 'Full Color Service appointment', '2025-03-08'),
    (5, 110, 0, 110, 'booking', 'Swedish Massage appointment', '2025-03-12'),
    (8, 75, 0, 75, 'booking', 'Mens Grooming Package', '2025-03-05'),
    (11, 175, 0, 175, 'booking', 'Bridal Updo trial', '2025-02-28'),
    (1, 50, 0, 330, 'referral', 'Referred Daniel Smith as new client', '2025-03-10'),
    (13, 175, 0, 175, 'booking', 'Hydrafacial appointment', '2025-03-01'),
    (4, 75, 0, 75, 'booking', 'Mens Grooming Package', '2025-02-25'),
    (7, 65, 0, 65, 'booking', 'Deep Conditioning Treatment', '2025-03-03'),
    (9, 145, 0, 145, 'booking', 'Full Color Service', '2025-02-20'),
    (6, 55, 0, 55, 'booking', 'Classic Haircut with loc work', '2025-03-14'),
    (1, 0, 100, 230, 'promo', 'Redeemed points for product discount', '2025-03-16'),
    (3, 25, 0, 170, 'review', 'Bonus for leaving a review', '2025-03-08'),
    (15, 185, 0, 185, 'booking', 'Balayage Color fantasy theme', '2025-02-18')
  `);
  console.log('✅ 16 Loyalty points seeded');

  // Seed 15 Gift Cards
  await pool.query(`
    INSERT INTO gift_cards (code, purchaser_name, purchaser_email, recipient_name, recipient_email, original_amount, remaining_balance, status, expiry_date, notes) VALUES
    ('GIFT-2025-001', 'Jennifer Adams', 'jennifer@email.com', 'Sarah Kim', 'sarah.k@email.com', 100.00, 100.00, 'active', '2025-12-31', 'Birthday gift'),
    ('GIFT-2025-002', 'Christopher Jones', 'chris@email.com', 'Amanda White', 'amanda@email.com', 200.00, 150.00, 'active', '2025-12-31', 'Holiday gift - partially redeemed'),
    ('GIFT-2025-003', 'Maria Rodriguez', 'maria@email.com', 'Emily Chen', 'emily.c@email.com', 75.00, 75.00, 'active', '2025-09-30', 'Thank you gift'),
    ('GIFT-2025-004', 'Rachel Foster', 'rachel@email.com', 'Lisa Park', 'lisa@email.com', 150.00, 0.00, 'redeemed', '2025-06-30', 'Fully redeemed on skincare services'),
    ('GIFT-2025-005', 'Kevin Nguyen', 'kevin@email.com', 'Michael Brown', 'michael@email.com', 50.00, 50.00, 'active', '2025-11-30', 'Bro code gift'),
    ('GIFT-2025-006', 'Thomas Wilson', 'thomas@email.com', 'Natasha Ivanova', 'natasha@email.com', 250.00, 250.00, 'active', '2026-03-31', 'Anniversary gift'),
    ('GIFT-2025-007', 'Daniel Smith', 'daniel@email.com', 'Jennifer Adams', 'jennifer@email.com', 100.00, 30.00, 'active', '2025-12-31', 'Partially used'),
    ('GIFT-2025-008', 'Robert Lee', 'robert@email.com', 'David Martinez', 'david.m@email.com', 75.00, 75.00, 'active', '2025-10-31', 'For the homie'),
    ('GIFT-2025-009', 'Amanda White', 'amanda@email.com', 'Maria Rodriguez', 'maria@email.com', 125.00, 125.00, 'active', '2026-01-31', 'Family appreciation'),
    ('GIFT-2025-010', 'Lisa Park', 'lisa@email.com', 'Rachel Foster', 'rachel@email.com', 300.00, 300.00, 'active', '2026-06-30', 'Wedding gift - for bridal services'),
    ('GIFT-2024-011', 'James Taylor', 'james.t@email.com', 'Kevin Nguyen', 'kevin@email.com', 100.00, 100.00, 'expired', '2025-01-31', 'Expired - not redeemed'),
    ('GIFT-2025-012', 'Emily Chen', 'emily.c@email.com', 'Thomas Wilson', 'thomas@email.com', 80.00, 80.00, 'active', '2025-12-31', 'Get well soon gift'),
    ('GIFT-2025-013', 'Natasha Ivanova', 'natasha@email.com', 'Daniel Smith', 'daniel@email.com', 50.00, 50.00, 'active', '2025-08-31', 'Welcome to the salon family'),
    ('GIFT-2025-014', 'Michael Brown', 'michael@email.com', 'Robert Lee', 'robert@email.com', 100.00, 45.00, 'active', '2025-12-31', 'Partially used for loc maintenance'),
    ('GIFT-2025-015', 'David Martinez', 'david.m@email.com', 'James Taylor', 'james.t@email.com', 75.00, 0.00, 'redeemed', '2025-06-30', 'Fully used on grooming services')
  `);
  console.log('✅ 15 Gift Cards seeded');

  // Seed 15 Expenses
  await pool.query(`
    INSERT INTO expenses (category, description, amount, vendor, payment_method, receipt_number, expense_date, is_recurring, recurrence_interval, notes) VALUES
    ('Rent', 'Monthly salon space rental - Downtown location', 4500.00, 'Metro Properties LLC', 'Bank Transfer', 'RNT-2025-03', '2025-03-01', true, 'monthly', 'Lease renewed through Dec 2026'),
    ('Utilities', 'Electric and water bill - March', 680.00, 'City Utilities', 'Bank Transfer', 'UTL-2025-03', '2025-03-05', true, 'monthly', 'Includes water heating for spa'),
    ('Supplies', 'Hair color supplies and developer', 1250.00, 'Sally Beauty Pro', 'Credit Card', 'SUP-2025-012', '2025-03-03', false, NULL, 'Quarterly color supply restock'),
    ('Equipment', 'New styling chair for station 5', 890.00, 'Salon Equipment Co', 'Credit Card', 'EQP-2025-003', '2025-03-08', false, NULL, 'Hydraulic lift model - 5yr warranty'),
    ('Marketing', 'Instagram and Facebook ad campaign - March', 450.00, 'Meta Business', 'Credit Card', 'MKT-2025-03', '2025-03-01', true, 'monthly', 'Spring promotion campaign'),
    ('Insurance', 'Business liability insurance - quarterly', 1800.00, 'State Farm Business', 'Bank Transfer', 'INS-2025-Q1', '2025-03-15', true, 'quarterly', 'Covers salon and spa services'),
    ('Payroll', 'Bi-weekly staff payroll', 12500.00, 'ADP Payroll', 'Bank Transfer', 'PAY-2025-06', '2025-03-15', true, 'monthly', '8 full-time, 4 part-time staff'),
    ('Training', 'Advanced color technique workshop - Emma & Diego', 350.00, 'Color Education Institute', 'Credit Card', 'TRN-2025-002', '2025-03-10', false, NULL, 'Two-day intensive workshop'),
    ('Maintenance', 'HVAC system quarterly maintenance', 275.00, 'Cool Air Solutions', 'Check', 'MNT-2025-Q1', '2025-03-12', true, 'quarterly', 'Filter replacement and inspection'),
    ('Supplies', 'Towels and linens bulk order', 420.00, 'Hotel Linen Supply', 'Credit Card', 'SUP-2025-013', '2025-03-07', false, NULL, '200 white towels, 50 robes'),
    ('Marketing', 'Salon website hosting and maintenance', 89.00, 'Squarespace', 'Credit Card', 'MKT-2025-WEB', '2025-03-01', true, 'monthly', 'Business plan with online booking'),
    ('Supplies', 'Disposable gloves, capes, and foils', 310.00, 'Beauty Depot', 'Debit Card', 'SUP-2025-014', '2025-03-09', false, NULL, 'Monthly disposables order'),
    ('Equipment', 'LED light therapy device for skincare', 1200.00, 'Medical Spa Equipment', 'Bank Transfer', 'EQP-2025-004', '2025-03-14', false, NULL, 'For Luna Korean skincare station'),
    ('Utilities', 'Business phone and internet - March', 185.00, 'Comcast Business', 'Bank Transfer', 'UTL-2025-NET', '2025-03-01', true, 'monthly', 'Fiber internet + 3 phone lines'),
    ('Other', 'Fresh flowers and lobby refreshments', 120.00, 'Local Florist & Market', 'Cash', 'OTH-2025-03', '2025-03-04', true, 'weekly', 'Weekly fresh arrangement + water/tea')
  `);
  console.log('✅ 15 Expenses seeded');

  // Seed 15 Communications
  await pool.query(`
    INSERT INTO communications (client_id, type, subject, message, status, sent_at, campaign_name) VALUES
    (1, 'email', 'Your Appointment Reminder', 'Hi Jennifer! This is a reminder for your Balayage appointment tomorrow at 9:00 AM with Emma. See you soon!', 'delivered', '2025-03-19 08:00:00', 'Appointment Reminders'),
    (2, 'sms', 'Appointment Confirmation', 'Hi Michael, your haircut with Marcus is confirmed for 3/20 at 10:00 AM. Reply CANCEL to cancel.', 'delivered', '2025-03-18 10:00:00', 'Appointment Reminders'),
    (3, 'email', 'Spring Color Special - 20% Off!', 'Sarah, spring is here! Get 20% off all color services with code SPRING20. Book now!', 'delivered', '2025-03-01 09:00:00', 'Spring Promotion'),
    (5, 'email', 'Spa Day Bundle - Save $30', 'Amanda, treat yourself! Combine a massage and facial and save $30. Use code SPADAY30.', 'delivered', '2025-03-15 09:00:00', 'Spa Promotion'),
    (11, 'email', 'Bridal Services Consultation', 'Rachel, congratulations on your upcoming wedding! We would love to schedule your bridal hair trial.', 'delivered', '2025-02-20 10:00:00', 'Bridal Outreach'),
    (16, 'email', 'Welcome to Salon & Spa!', 'Hi Daniel, welcome! As a new client, enjoy $25 off with code WELCOME25. We look forward to seeing you.', 'delivered', '2025-03-17 11:00:00', 'New Client Welcome'),
    (7, 'email', 'Product Recommendation Follow-up', 'Emily, after your deep conditioning, we recommend the DevaCurl Hydrating Curl Cream for at-home care.', 'delivered', '2025-03-03 15:00:00', 'Post-Service Follow-up'),
    (1, 'email', 'Thank You for Your Review!', 'Jennifer, thank you for your 5-star review! We have added 25 loyalty points to your account.', 'delivered', '2025-03-16 12:00:00', 'Review Thank You'),
    (4, 'sms', 'Time to Rebook!', 'David, it has been 3 weeks since your last cut. Book your next appointment with Marcus now!', 'delivered', '2025-03-17 14:00:00', 'Rebooking Automation'),
    (9, 'email', 'Family Booking Special', 'Maria, book for 3+ family members and get 10% off the total. Perfect for your family visits!', 'sent', '2025-03-18 09:00:00', 'Family Promotion'),
    (13, 'push', 'Your Hydrafacial Results', 'Lisa, your skin analysis from your recent Hydrafacial is ready. View your personalized skincare plan.', 'delivered', '2025-03-02 16:00:00', 'Post-Service Follow-up'),
    (15, 'email', 'Fantasy Color Maintenance Tips', 'Natasha, here are tips to keep your galaxy hair vibrant: use cold water, color-safe shampoo, and avoid sun exposure.', 'delivered', '2025-02-19 10:00:00', 'Post-Service Follow-up'),
    (8, 'email', 'VIP Monthly Newsletter', 'Christopher, check out this month exclusive offers, new services, and styling tips from our team.', 'sent', '2025-03-01 08:00:00', 'Monthly Newsletter'),
    (6, 'sms', 'Waitlist Update', 'Robert, a spot has opened for your preferred Saturday appointment. Reply YES to confirm.', 'delivered', '2025-03-19 09:00:00', 'Waitlist Notifications'),
    (12, 'email', 'Scalp Care Tips', 'Thomas, here are gentle scalp care tips recommended by Sophia after your last visit. Tea-tree-free options included.', 'delivered', '2025-03-16 11:00:00', 'Post-Service Follow-up')
  `);
  console.log('✅ 15 Communications seeded');

  // Seed Tips
  await pool.query(`
    INSERT INTO tips (stylist_id, client_id, service_id, booking_id, amount, payment_method, tip_date, notes) VALUES
    (1, 1, 1, 1, 15.00, 'Cash', '2025-03-20', 'Great haircut'),
    (2, 2, 3, 2, 25.00, 'Credit Card', '2025-03-20', 'Amazing balayage'),
    (3, 3, 5, 3, 10.00, 'Cash', '2025-03-19', NULL),
    (4, 4, 7, 4, 20.00, 'Venmo', '2025-03-19', 'Loved the deep conditioning'),
    (5, 5, 9, 5, 30.00, 'Credit Card', '2025-03-18', 'Best facial ever'),
    (1, 6, 2, 6, 12.00, 'Cash', '2025-03-18', NULL),
    (6, 7, 11, 7, 18.00, 'Cash', '2025-03-17', 'Relaxing massage'),
    (2, 8, 4, 8, 22.00, 'Credit Card', '2025-03-17', NULL),
    (7, 9, 13, 9, 8.00, 'Cash', '2025-03-16', NULL),
    (3, 10, 6, 10, 15.00, 'Debit Card', '2025-03-16', 'Love the color')
  `);
  console.log('✅ 10 Tips seeded');

  // Seed Checkins
  await pool.query(`
    INSERT INTO checkins (booking_id, status, checked_in_at, service_started_at, completed_at) VALUES
    (1, 'completed', '2025-03-20 09:55:00', '2025-03-20 10:02:00', '2025-03-20 10:45:00'),
    (2, 'completed', '2025-03-20 10:25:00', '2025-03-20 10:35:00', '2025-03-20 12:30:00'),
    (3, 'completed', '2025-03-19 13:50:00', '2025-03-19 14:05:00', '2025-03-19 14:35:00'),
    (4, 'in_service', '2025-03-20 14:00:00', '2025-03-20 14:10:00', NULL),
    (5, 'checked_in', '2025-03-20 15:50:00', NULL, NULL),
    (6, 'no_show', NULL, NULL, NULL)
  `);
  console.log('✅ 6 Checkins seeded');

  // Seed Membership Plans
  await pool.query(`
    INSERT INTO membership_plans (name, description, price, billing_cycle, included_services, max_bookings_per_month, discount_percent) VALUES
    ('Basic', 'Essential salon services at a great price', 49.99, 'monthly', 'Haircut, Blowout', 2, 10),
    ('Premium', 'Full access to hair and spa services', 99.99, 'monthly', 'Haircut, Color, Blowout, Basic Facial', 4, 15),
    ('VIP', 'Unlimited access to all services with priority booking', 179.99, 'monthly', 'All Services', 8, 25),
    ('Annual Basic', 'Save with annual commitment', 479.99, 'annual', 'Haircut, Blowout', 2, 15),
    ('Annual VIP', 'Best value - full year of VIP access', 1799.99, 'annual', 'All Services', 8, 30)
  `);
  console.log('✅ 5 Membership Plans seeded');

  // Seed Memberships
  await pool.query(`
    INSERT INTO memberships (client_id, plan_id, plan_name, start_date, end_date, price, status, payment_method, bookings_used) VALUES
    (1, 2, 'Premium', '2025-03-01', '2025-04-01', 99.99, 'active', 'credit_card', 2),
    (3, 3, 'VIP', '2025-02-15', '2025-03-15', 179.99, 'active', 'credit_card', 5),
    (5, 1, 'Basic', '2025-03-10', '2025-04-10', 49.99, 'active', 'debit_card', 1),
    (8, 5, 'Annual VIP', '2025-01-01', '2026-01-01', 1799.99, 'active', 'credit_card', 6),
    (12, 2, 'Premium', '2025-02-01', '2025-03-01', 99.99, 'cancelled', 'credit_card', 3)
  `);
  console.log('✅ 5 Memberships seeded');

  // Seed Suppliers
  await pool.query(`
    INSERT INTO suppliers (name, contact_person, email, phone, address, product_categories, payment_terms, notes) VALUES
    ('BeautyPro Distributors', 'Mark Johnson', 'mark@beautypro.com', '555-0201', '123 Beauty Blvd, Suite 100', 'Hair Care, Styling Tools', 'Net 30', 'Primary hair product supplier'),
    ('SkinGlow Labs', 'Dr. Amy Chen', 'orders@skinglowlabs.com', '555-0202', '456 Skincare Lane', 'Skincare, Facials', 'Net 15', 'Organic and medical-grade products'),
    ('NailArt Supply Co', 'Jessica Rivera', 'jessica@nailart.com', '555-0203', '789 Color Street', 'Nail Polish, Nail Care, Accessories', 'COD', 'Wide variety of gel and regular polish'),
    ('Spa Essentials Inc', 'David Park', 'david@spaessentials.com', '555-0204', '321 Relaxation Rd', 'Massage Oils, Spa Equipment, Towels', 'Net 45', 'Premium spa supplies'),
    ('Luxe Color House', 'Francesca Mori', 'francesca@luxecolor.com', '555-0205', '567 Pigment Ave', 'Hair Color, Developer, Bleach', 'Net 30', 'Professional color line')
  `);
  console.log('✅ 5 Suppliers seeded');

  // Seed Supplier Orders
  await pool.query(`
    INSERT INTO supplier_orders (supplier_id, items, total_amount, order_date, expected_delivery, status, notes) VALUES
    (1, 'Shampoo x20, Conditioner x20, Hair Oil x15', 450.00, '2025-03-10', '2025-03-17', 'delivered', 'Monthly restock'),
    (2, 'Vitamin C Serum x10, Moisturizer x12, Cleanser x15', 680.00, '2025-03-15', '2025-03-22', 'shipped', 'Spring collection'),
    (3, 'Gel Polish Set x5, Base Coat x10, Top Coat x10', 320.00, '2025-03-18', '2025-03-25', 'pending', 'New spring colors'),
    (5, 'Balayage Kit x8, Developer 20vol x10, Toner x12', 520.00, '2025-03-12', '2025-03-19', 'delivered', NULL),
    (4, 'Massage Oil x15, Hot Stones Set x2, Towels x50', 890.00, '2025-03-20', '2025-03-30', 'pending', 'Quarterly supply order')
  `);
  console.log('✅ 5 Supplier Orders seeded');

  // Seed Payroll
  await pool.query(`
    INSERT INTO payroll (stylist_id, pay_period_start, pay_period_end, base_pay, commission_amount, tips_amount, deductions, bonus, total_pay, status, notes) VALUES
    (1, '2025-03-01', '2025-03-15', 1200.00, 480.00, 127.00, 180.00, 50.00, 1677.00, 'paid', 'First half March'),
    (2, '2025-03-01', '2025-03-15', 1400.00, 620.00, 147.00, 210.00, 100.00, 2057.00, 'paid', 'First half March'),
    (3, '2025-03-01', '2025-03-15', 1100.00, 350.00, 85.00, 165.00, 0.00, 1370.00, 'paid', 'First half March'),
    (1, '2025-03-16', '2025-03-31', 1200.00, 510.00, 142.00, 180.00, 0.00, 1672.00, 'pending', 'Second half March'),
    (2, '2025-03-16', '2025-03-31', 1400.00, 580.00, 122.00, 210.00, 0.00, 1892.00, 'pending', 'Second half March'),
    (4, '2025-03-01', '2025-03-15', 1000.00, 290.00, 80.00, 150.00, 0.00, 1220.00, 'paid', 'First half March'),
    (5, '2025-03-01', '2025-03-15', 1300.00, 550.00, 130.00, 195.00, 75.00, 1860.00, 'paid', 'First half March - top performer bonus')
  `);
  console.log('✅ 7 Payroll records seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('Demo login users provisioned from the local environment.');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
