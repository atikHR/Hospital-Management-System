const pool = require('../config/db');

// Get doctor's own profile
exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.name, u.email, u.phone, c.name as category_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.user_id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update doctor's own profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, qualification, avg_consult_time, available_days, start_time, end_time } = req.body;

    // Update user info
    if (name || phone) {
      await pool.query(
        'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = NOW() WHERE id = $3',
        [name, phone, req.user.id]
      );
    }

    // Get doctor id
    const doctorResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    // Update doctor profile
    const result = await pool.query(
      `UPDATE doctors SET
        bio = COALESCE($1, bio),
        qualification = COALESCE($2, qualification),
        avg_consult_time = COALESCE($3, avg_consult_time),
        available_days = COALESCE($4, available_days),
        start_time = COALESCE($5, start_time),
        end_time = COALESCE($6, end_time)
      WHERE user_id = $7 RETURNING *`,
      [bio, qualification, avg_consult_time, available_days, start_time, end_time, req.user.id]
    );

    res.json({ message: 'Profile updated.', doctor: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get doctor's dashboard stats
exports.getStats = async (req, res) => {
  try {
    const doctorResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }
    const doctorId = doctorResult.rows[0].id;

    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status != 'cancelled') as total_patients,
        COUNT(*) FILTER (WHERE status = 'waiting') as waiting,
        COUNT(*) FILTER (WHERE status = 'currently_examining') as examining,
        COUNT(*) FILTER (WHERE status = 'done') as done,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
      FROM appointments
      WHERE doctor_id = $1 AND appointment_date = CURRENT_DATE
    `, [doctorId]);

    res.json({
      doctorId,
      ...stats.rows[0],
      total_patients: parseInt(stats.rows[0].total_patients),
      waiting: parseInt(stats.rows[0].waiting),
      examining: parseInt(stats.rows[0].examining),
      done: parseInt(stats.rows[0].done),
      cancelled: parseInt(stats.rows[0].cancelled),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get today's patient queue
exports.getTodayAppointments = async (req, res) => {
  try {
    const doctorResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }
    const doctorId = doctorResult.rows[0].id;

    const { filter } = req.query; // 'all', 'waiting', 'done'

    let statusFilter = '';
    if (filter === 'waiting') statusFilter = "AND a.status IN ('waiting', 'currently_examining')";
    else if (filter === 'done') statusFilter = "AND a.status = 'done'";

    const result = await pool.query(`
      SELECT a.*, u.name as patient_name, u.phone as patient_phone, u.email as patient_email
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      WHERE a.doctor_id = $1 AND a.appointment_date = CURRENT_DATE ${statusFilter}
      ORDER BY a.serial_number
    `, [doctorId]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update patient status (with Socket.IO emit)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['waiting', 'currently_examining', 'done', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    // Get doctor info
    const doctorResult = await pool.query('SELECT id, avg_consult_time FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }
    const doctorId = doctorResult.rows[0].id;

    // Verify this appointment belongs to this doctor
    const appointment = await pool.query(
      'SELECT * FROM appointments WHERE id = $1 AND doctor_id = $2',
      [id, doctorId]
    );
    if (appointment.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Update appointment status
    const result = await pool.query(
      "UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, id]
    );

    // Update queue tracking if examining
    if (status === 'currently_examining') {
      await pool.query(
        `INSERT INTO queue_tracking (doctor_id, appointment_date, current_serial, last_updated)
         VALUES ($1, CURRENT_DATE, $2, NOW())
         ON CONFLICT (doctor_id, appointment_date) DO UPDATE SET current_serial = $2, last_updated = NOW()`,
        [doctorId, result.rows[0].serial_number]
      );
    }

    // If done, move current_serial forward
    if (status === 'done') {
      await pool.query(
        `INSERT INTO queue_tracking (doctor_id, appointment_date, current_serial, last_updated)
         VALUES ($1, CURRENT_DATE, $2, NOW())
         ON CONFLICT (doctor_id, appointment_date) DO UPDATE SET current_serial = $2, last_updated = NOW()`,
        [doctorId, result.rows[0].serial_number]
      );
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      // Notify specific patient
      io.to(`patient_${result.rows[0].patient_id}`).emit('status_update', {
        appointmentId: result.rows[0].id,
        status: result.rows[0].status,
        serialNumber: result.rows[0].serial_number,
      });

      // Notify all patients of this doctor for today
      io.to(`doctor_queue_${doctorId}`).emit('queue_moved', {
        doctorId,
        currentSerial: result.rows[0].serial_number,
        avgConsultTime: doctorResult.rows[0].avg_consult_time,
      });
    }

    res.json({ message: 'Status updated.', appointment: result.rows[0] });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get appointment history
exports.getAppointmentHistory = async (req, res) => {
  try {
    const doctorResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    const result = await pool.query(`
      SELECT a.*, u.name as patient_name, u.phone as patient_phone
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      WHERE a.doctor_id = $1 AND a.appointment_date < CURRENT_DATE
      ORDER BY a.appointment_date DESC, a.serial_number
      LIMIT 100
    `, [doctorResult.rows[0].id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Toggle chamber active status
exports.toggleChamberStatus = async (req, res) => {
  try {
    const doctorResult = await pool.query('SELECT id, is_in_chamber FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }
    const doctorId = doctorResult.rows[0].id;
    const newStatus = !doctorResult.rows[0].is_in_chamber;

    await pool.query('UPDATE doctors SET is_in_chamber = $1 WHERE id = $2', [newStatus, doctorId]);

    // Notify all patients via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`doctor_queue_${doctorId}`).emit('doctor_chamber_update', {
        doctorId,
        isInChamber: newStatus,
      });
    }

    res.json({ message: `Chamber status ${newStatus ? 'activated' : 'deactivated'}.`, is_in_chamber: newStatus });
  } catch (error) {
    console.error('Toggle chamber error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Set chamber start time
exports.setChamberTime = async (req, res) => {
  try {
    const { chamber_start_time } = req.body;
    const doctorResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }
    const doctorId = doctorResult.rows[0].id;

    await pool.query('UPDATE doctors SET chamber_start_time = $1 WHERE id = $2', [chamber_start_time, doctorId]);

    // Notify all patients
    const io = req.app.get('io');
    if (io) {
      io.to(`doctor_queue_${doctorId}`).emit('doctor_chamber_time_update', {
        doctorId,
        chamberStartTime: chamber_start_time,
      });
    }

    res.json({ message: 'Chamber time updated.', chamber_start_time });
  } catch (error) {
    console.error('Set chamber time error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Send announcement to all patients
exports.sendAnnouncement = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required.' });

    const doctorResult = await pool.query(
      `SELECT d.id, u.name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.user_id = $1`,
      [req.user.id]
    );
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }
    const doctorId = doctorResult.rows[0].id;
    const doctorName = doctorResult.rows[0].name;

    // Save announcement
    const result = await pool.query(
      'INSERT INTO doctor_announcements (doctor_id, message) VALUES ($1, $2) RETURNING *',
      [doctorId, message]
    );

    // Broadcast to all patients with today appointments
    const io = req.app.get('io');
    if (io) {
      // Get all patient IDs with today appointments
      const patients = await pool.query(
        'SELECT DISTINCT patient_id FROM appointments WHERE doctor_id = $1 AND appointment_date = CURRENT_DATE AND status IN (\'waiting\', \'currently_examining\')',
        [doctorId]
      );

      patients.rows.forEach(p => {
        io.to(`patient_${p.patient_id}`).emit('doctor_announcement', {
          doctorId,
          doctorName,
          message,
          createdAt: result.rows[0].created_at,
        });
      });

      // Also broadcast to doctor queue room
      io.to(`doctor_queue_${doctorId}`).emit('doctor_announcement', {
        doctorId,
        doctorName,
        message,
        createdAt: result.rows[0].created_at,
      });
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Send announcement error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get doctor's announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const doctorResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    const result = await pool.query(
      'SELECT * FROM doctor_announcements WHERE doctor_id = $1 ORDER BY created_at DESC LIMIT 20',
      [doctorResult.rows[0].id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    await pool.query('DELETE FROM doctor_announcements WHERE id = $1 AND doctor_id = $2', [id, doctorResult.rows[0].id]);
    res.json({ message: 'Announcement deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

