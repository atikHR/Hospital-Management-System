const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const testResultController = require('../controllers/testResultController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public routes
router.get('/categories', patientController.getCategories);
router.get('/doctors', patientController.getDoctors);
router.get('/doctors/category/:categoryId', patientController.getDoctorsByCategory);
router.get('/doctors/:id', patientController.getDoctorById);

// Public: active offers
router.get('/offers', async (req, res) => {
  try {
    const pool = require('../config/db');
    const result = await pool.query('SELECT * FROM special_offers WHERE is_active = true ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Public: active health quotes
router.get('/quotes', async (req, res) => {
  try {
    const pool = require('../config/db');
    const result = await pool.query('SELECT * FROM health_quotes WHERE is_active = true ORDER BY display_order ASC, created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Public: doctor chamber info (for patients to see)
router.get('/doctors/:id/chamber-info', async (req, res) => {
  try {
    const pool = require('../config/db');
    const { id } = req.params;
    const result = await pool.query(
      'SELECT is_in_chamber, chamber_start_time FROM doctors WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Doctor not found.' });

    // Get recent announcements
    const announcements = await pool.query(
      'SELECT * FROM doctor_announcements WHERE doctor_id = $1 AND is_active = true AND created_at > NOW() - INTERVAL \'24 hours\' ORDER BY created_at DESC LIMIT 5',
      [id]
    );

    res.json({
      ...result.rows[0],
      announcements: announcements.rows,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Patient protected routes
router.post('/appointments', authMiddleware, roleMiddleware('patient'), patientController.bookAppointment);
router.get('/appointments/my', authMiddleware, roleMiddleware('patient'), patientController.getMyAppointments);
router.get('/appointments/:id/status', authMiddleware, roleMiddleware('patient'), patientController.getAppointmentStatus);
router.delete('/appointments/:id', authMiddleware, roleMiddleware('patient'), patientController.cancelAppointment);
router.put('/profile', authMiddleware, roleMiddleware('patient'), patientController.updateProfile);

// Test results routes
router.get('/results', authMiddleware, roleMiddleware('patient'), testResultController.getMyResults);
router.post('/results', authMiddleware, roleMiddleware('patient'), (req, res, next) => {
  testResultController.uploadMiddleware(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, testResultController.uploadResult);
router.delete('/results/:id', authMiddleware, roleMiddleware('patient'), testResultController.deleteResult);

module.exports = router;
