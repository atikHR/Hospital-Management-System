const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All doctor routes require auth + doctor role
router.use(authMiddleware, roleMiddleware('doctor'));

router.get('/profile', doctorController.getProfile);
router.put('/profile', doctorController.updateProfile);
router.get('/stats', doctorController.getStats);
router.get('/appointments', doctorController.getTodayAppointments);
router.get('/appointments/history', doctorController.getAppointmentHistory);
router.put('/appointments/:id/status', doctorController.updateAppointmentStatus);

// Chamber status
router.put('/chamber/toggle', doctorController.toggleChamberStatus);
router.put('/chamber/time', doctorController.setChamberTime);

// Announcements
router.get('/announcements', doctorController.getAnnouncements);
router.post('/announcements', doctorController.sendAnnouncement);
router.delete('/announcements/:id', doctorController.deleteAnnouncement);

module.exports = router;
