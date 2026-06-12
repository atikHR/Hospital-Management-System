-- Hospital Management System Schema

-- Users table (all roles)
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
  phone       VARCHAR(20),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Categories for doctors
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon        VARCHAR(50) DEFAULT '🏥',
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Doctor profiles
CREATE TABLE IF NOT EXISTS doctors (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  specialty       VARCHAR(150),
  bio             TEXT,
  profile_photo   VARCHAR(255),
  qualification   VARCHAR(255),
  experience_years INTEGER DEFAULT 0,
  avg_consult_time INTEGER DEFAULT 10,
  available_days  VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
  start_time      TIME DEFAULT '09:00',
  end_time        TIME DEFAULT '17:00',
  max_patients_per_day INTEGER DEFAULT 30,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id              SERIAL PRIMARY KEY,
  patient_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  doctor_id       INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  serial_number   INTEGER NOT NULL,
  status          VARCHAR(30) DEFAULT 'waiting'
                  CHECK (status IN ('waiting', 'currently_examining', 'done', 'cancelled')),
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, serial_number)
);

-- Queue tracking for real-time
CREATE TABLE IF NOT EXISTS queue_tracking (
  id                    SERIAL PRIMARY KEY,
  doctor_id             INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date      DATE NOT NULL,
  current_serial        INTEGER DEFAULT 0,
  last_updated          TIMESTAMP DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date)
);

-- Hospital Images (hero background slideshow)
CREATE TABLE IF NOT EXISTS hospital_images (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(200),
  description   TEXT,
  image_url     VARCHAR(500) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Facility Images (facility section slideshow)
CREATE TABLE IF NOT EXISTS facility_images (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  image_url     VARCHAR(500) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Doctor chamber status columns (added via ALTER for existing tables)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS chamber_start_time TIME;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_in_chamber BOOLEAN DEFAULT FALSE;

-- Doctor announcements (broadcast messages to patients)
CREATE TABLE IF NOT EXISTS doctor_announcements (
  id            SERIAL PRIMARY KEY,
  doctor_id     INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Health quotes (managed by admin, shown on homepage)
CREATE TABLE IF NOT EXISTS health_quotes (
  id            SERIAL PRIMARY KEY,
  quote_text    TEXT NOT NULL,
  author        VARCHAR(200) NOT NULL,
  source        VARCHAR(200),
  category      VARCHAR(50) DEFAULT 'general'
                CHECK (category IN ('hadith', 'scholar', 'general')),
  is_active     BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Test results uploaded by patients (or auto-stored from appointments)
CREATE TABLE IF NOT EXISTS test_results (
  id            SERIAL PRIMARY KEY,
  patient_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  test_date     DATE,
  test_type     VARCHAR(100),
  result_value  TEXT,
  file_url      VARCHAR(500),
  file_name     VARCHAR(255),
  file_size     INTEGER,
  uploaded_by   VARCHAR(20) DEFAULT 'patient' CHECK (uploaded_by IN ('patient', 'doctor', 'admin')),
  doctor_id     INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctors_category ON doctors(category_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_doctor_announcements_doctor ON doctor_announcements(doctor_id);
CREATE INDEX IF NOT EXISTS idx_health_quotes_active ON health_quotes(is_active);
CREATE INDEX IF NOT EXISTS idx_test_results_patient ON test_results(patient_id);
