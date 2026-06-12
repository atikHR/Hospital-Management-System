const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Get admin stats
exports.getStats = async (req, res) => {
  try {
    const doctorsCount = await pool.query("SELECT COUNT(*) FROM doctors WHERE is_active = true");
    const patientsCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'patient'");
    const todayAppointments = await pool.query(
      "SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE"
    );
    const categoriesCount = await pool.query("SELECT COUNT(*) FROM categories");

    res.json({
      totalDoctors: parseInt(doctorsCount.rows[0].count),
      totalPatients: parseInt(patientsCount.rows[0].count),
      todayAppointments: parseInt(todayAppointments.rows[0].count),
      totalCategories: parseInt(categoriesCount.rows[0].count),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- CATEGORY CRUD ----

exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required.' });

    const result = await pool.query(
      'INSERT INTO categories (name, description, icon) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, icon || '🏥']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Category already exists.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const result = await pool.query(
      'UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description), icon = COALESCE($3, icon) WHERE id = $4 RETURNING *',
      [name, description, icon, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Category not found.' });
    res.json({ message: 'Category deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- DOCTOR MANAGEMENT ----

exports.getDoctors = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.name, u.email, u.phone, c.name as category_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN categories c ON d.category_id = c.id
      ORDER BY u.name, d.id
    `);
    // Deduplicate by name — keep only the first record per name (lowest id)
    const seen = new Set();
    const rows = result.rows.filter(row => {
      const key = row.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.createDoctor = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      name, email, password, phone,
      category_id, specialty, bio, qualification,
      experience_years, avg_consult_time, available_days,
      start_time, end_time, max_patients_per_day
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Check existing user by email
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Warn if a doctor with the same name already exists (prevent accidental duplicates)
    const sameName = await client.query(
      "SELECT u.id FROM users u WHERE LOWER(u.name) = LOWER($1) AND u.role = 'doctor'",
      [name]
    );
    if (sameName.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: `A doctor named "${name}" already exists. Please use a different name or update the existing doctor.` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await client.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, hashedPassword, 'doctor', phone || null]
    );

    const userId = userResult.rows[0].id;

    // Create doctor profile
    const doctorResult = await client.query(
      `INSERT INTO doctors (user_id, category_id, specialty, bio, qualification, experience_years, avg_consult_time, available_days, start_time, end_time, max_patients_per_day)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        userId, category_id || null, specialty || null, bio || null,
        qualification || null, experience_years || 0, avg_consult_time || 10,
        available_days || 'Mon,Tue,Wed,Thu,Fri', start_time || '09:00',
        end_time || '17:00', max_patients_per_day || 30
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Doctor created successfully.',
      doctor: { ...doctorResult.rows[0], name, email, phone }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create doctor error:', error);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, phone, category_id, specialty, bio, qualification,
      experience_years, avg_consult_time, available_days,
      start_time, end_time, max_patients_per_day, is_active
    } = req.body;

    // Get doctor's user_id
    const doctor = await pool.query('SELECT user_id FROM doctors WHERE id = $1', [id]);
    if (doctor.rows.length === 0) return res.status(404).json({ message: 'Doctor not found.' });

    // Update user info
    if (name || phone) {
      await pool.query(
        'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = NOW() WHERE id = $3',
        [name, phone, doctor.rows[0].user_id]
      );
    }

    // Update doctor profile
    const result = await pool.query(
      `UPDATE doctors SET
        category_id = COALESCE($1, category_id),
        specialty = COALESCE($2, specialty),
        bio = COALESCE($3, bio),
        qualification = COALESCE($4, qualification),
        experience_years = COALESCE($5, experience_years),
        avg_consult_time = COALESCE($6, avg_consult_time),
        available_days = COALESCE($7, available_days),
        start_time = COALESCE($8, start_time),
        end_time = COALESCE($9, end_time),
        max_patients_per_day = COALESCE($10, max_patients_per_day),
        is_active = COALESCE($11, is_active)
      WHERE id = $12 RETURNING *`,
      [category_id, specialty, bio, qualification, experience_years,
        avg_consult_time, available_days, start_time, end_time,
        max_patients_per_day, is_active, id]
    );

    res.json({ message: 'Doctor updated.', doctor: result.rows[0] });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await pool.query('SELECT user_id FROM doctors WHERE id = $1', [id]);
    if (doctor.rows.length === 0) return res.status(404).json({ message: 'Doctor not found.' });

    // Deleting user cascades to doctor profile
    await pool.query('DELETE FROM users WHERE id = $1', [doctor.rows[0].user_id]);
    res.json({ message: 'Doctor removed.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- PATIENT MANAGEMENT ----

exports.getPatients = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, created_at FROM users WHERE role = 'patient' ORDER BY name"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM users WHERE id = $1 AND role = 'patient' RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Patient not found.' });
    res.json({ message: 'Patient removed.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- ALL APPOINTMENTS ----

exports.getAllAppointments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.name as patient_name, u.phone as patient_phone,
             du.name as doctor_name, c.name as category_name
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      LEFT JOIN categories c ON d.category_id = c.id
      ORDER BY a.appointment_date DESC, a.serial_number
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- SPECIAL OFFERS ----

exports.getOffers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM special_offers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.createOffer = async (req, res) => {
  try {
    const { title, description, badge, color, link } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });
    const result = await pool.query(
      'INSERT INTO special_offers (title, description, badge, color, link) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description || null, badge || 'NEW', color || '#16C79A', link || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, badge, color, link, is_active } = req.body;
    const result = await pool.query(
      `UPDATE special_offers SET title=COALESCE($1,title), description=COALESCE($2,description),
       badge=COALESCE($3,badge), color=COALESCE($4,color), link=COALESCE($5,link),
       is_active=COALESCE($6,is_active) WHERE id=$7 RETURNING *`,
      [title, description, badge, color, link, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Offer not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM special_offers WHERE id = $1', [id]);
    res.json({ message: 'Offer deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- HEALTH QUOTES ----

exports.getQuotes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM health_quotes ORDER BY display_order ASC, created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.createQuote = async (req, res) => {
  try {
    const { quote_text, author, source, category, display_order } = req.body;
    if (!quote_text || !author) return res.status(400).json({ message: 'Quote text and author are required.' });

    const result = await pool.query(
      'INSERT INTO health_quotes (quote_text, author, source, category, display_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [quote_text, author, source || null, category || 'general', display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { quote_text, author, source, category, is_active, display_order } = req.body;

    const result = await pool.query(
      `UPDATE health_quotes SET
        quote_text = COALESCE($1, quote_text),
        author = COALESCE($2, author),
        source = COALESCE($3, source),
        category = COALESCE($4, category),
        is_active = COALESCE($5, is_active),
        display_order = COALESCE($6, display_order)
      WHERE id = $7 RETURNING *`,
      [quote_text, author, source, category, is_active, display_order, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Quote not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM health_quotes WHERE id = $1', [id]);
    res.json({ message: 'Quote deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
