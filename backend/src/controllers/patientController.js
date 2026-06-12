const pool = require('../config/db');
const { estimateWaitTime } = require('../utils/timeEstimator');

// Get all categories (public)
exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, COUNT(d.id) as doctor_count
      FROM categories c
      LEFT JOIN doctors d ON c.id = d.category_id AND d.is_active = true
      GROUP BY c.id
      ORDER BY c.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all doctors (public) with optional category filter
exports.getDoctors = async (req, res) => {
  try {
    const { category_id, search } = req.query;
    let query = `
      SELECT d.*, u.name, u.email, u.phone, c.name as category_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.is_active = true
    `;
    const params = [];

    if (category_id) {
      params.push(category_id);
      query += ` AND d.category_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.name ILIKE $${params.length} OR d.specialty ILIKE $${params.length})`;
    }

    query += ' ORDER BY u.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get single doctor (public)
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT d.*, u.name, u.email, u.phone, c.name as category_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    // Get today's queue info
    const queueInfo = await pool.query(
      "SELECT COUNT(*) as total_patients FROM appointments WHERE doctor_id = $1 AND appointment_date = CURRENT_DATE AND status != 'cancelled'",
      [id]
    );

    res.json({
      ...result.rows[0],
      todayPatients: parseInt(queueInfo.rows[0].total_patients)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get doctors by category (public)
exports.getDoctorsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const result = await pool.query(`
      SELECT d.*, u.name, u.email, u.phone, c.name as category_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.category_id = $1 AND d.is_active = true
      ORDER BY u.name
    `, [categoryId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- PATIENT ACTIONS ----

// Map JS day index to abbreviation used in available_days
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Book an appointment
exports.bookAppointment = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { doctor_id, appointment_date, notes } = req.body;
    const patient_id = req.user.id;

    if (!doctor_id || !appointment_date) {
      return res.status(400).json({ message: 'Doctor and appointment date are required.' });
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookDate = new Date(appointment_date);
    if (isNaN(bookDate.getTime())) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid appointment date.' });
    }
    if (bookDate < today) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cannot book appointments in the past.' });
    }

    // Check if doctor exists and is active
    const doctor = await client.query(
      'SELECT * FROM doctors WHERE id = $1 AND is_active = true',
      [doctor_id]
    );
    if (doctor.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Doctor not found or inactive.' });
    }

    // Validate that the chosen day is within the doctor's available_days
    const dayAbbr = DAY_ABBR[bookDate.getDay()];
    const availableDays = (doctor.rows[0].available_days || '').split(',').map(d => d.trim());
    if (!availableDays.includes(dayAbbr)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: `Dr. is not available on ${dayAbbr}. Available days: ${doctor.rows[0].available_days}`
      });
    }

    // Check duplicate booking
    const existing = await client.query(
      "SELECT id FROM appointments WHERE patient_id = $1 AND doctor_id = $2 AND appointment_date = $3 AND status != 'cancelled'",
      [patient_id, doctor_id, appointment_date]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'You already have an appointment with this doctor on this date.' });
    }

    // Check max patients
    const currentCount = await client.query(
      "SELECT COUNT(*) FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND status != 'cancelled'",
      [doctor_id, appointment_date]
    );
    if (parseInt(currentCount.rows[0].count) >= doctor.rows[0].max_patients_per_day) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Doctor is fully booked for this date.' });
    }

    // Get next serial number
    const serialResult = await client.query(
      "SELECT COALESCE(MAX(serial_number), 0) + 1 as next_serial FROM appointments WHERE doctor_id = $1 AND appointment_date = $2",
      [doctor_id, appointment_date]
    );
    const serial_number = serialResult.rows[0].next_serial;

    // Create appointment
    const result = await client.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, serial_number, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patient_id, doctor_id, appointment_date, serial_number, notes || null]
    );

    // Ensure queue_tracking entry exists
    await client.query(
      `INSERT INTO queue_tracking (doctor_id, appointment_date, current_serial)
       VALUES ($1, $2, 0)
       ON CONFLICT (doctor_id, appointment_date) DO NOTHING`,
      [doctor_id, appointment_date]
    );

    await client.query('COMMIT');

    // Calculate estimated wait time
    const queueTrack = await pool.query(
      'SELECT current_serial FROM queue_tracking WHERE doctor_id = $1 AND appointment_date = $2',
      [doctor_id, appointment_date]
    );
    const currentSerial = queueTrack.rows.length > 0 ? queueTrack.rows[0].current_serial : 0;
    const waitInfo = estimateWaitTime(serial_number, currentSerial, doctor.rows[0].avg_consult_time);

    res.status(201).json({
      message: 'Appointment booked successfully.',
      appointment: result.rows[0],
      waitInfo
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Book appointment error:', error);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// Get my appointments
exports.getMyAppointments = async (req, res) => {
  try {
    const patient_id = req.user.id;

    const result = await pool.query(`
      SELECT a.*, du.name as doctor_name, d.specialty, d.avg_consult_time,
             c.name as category_name, d.profile_photo,
             qt.current_serial
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN queue_tracking qt ON qt.doctor_id = a.doctor_id AND qt.appointment_date = a.appointment_date
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date DESC, a.serial_number
    `, [patient_id]);

    // Add estimated wait time
    const appointments = result.rows.map(apt => {
      const currentSerial = apt.current_serial || 0;
      const waitInfo = estimateWaitTime(apt.serial_number, currentSerial, apt.avg_consult_time);
      return { ...apt, waitInfo };
    });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get appointment status
exports.getAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT a.*, d.avg_consult_time, qt.current_serial
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN queue_tracking qt ON qt.doctor_id = a.doctor_id AND qt.appointment_date = a.appointment_date
      WHERE a.id = $1 AND a.patient_id = $2
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const apt = result.rows[0];
    const currentSerial = apt.current_serial || 0;
    const waitInfo = estimateWaitTime(apt.serial_number, currentSerial, apt.avg_consult_time);

    res.json({ ...apt, waitInfo });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND patient_id = $2 AND status = 'waiting' RETURNING *",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found or cannot be cancelled.' });
    }

    res.json({ message: 'Appointment cancelled.', appointment: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update patient profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = NOW() WHERE id = $3 RETURNING id, name, email, phone, role',
      [name, phone, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
