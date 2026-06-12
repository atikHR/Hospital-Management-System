const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All admin routes require auth + admin role
router.use(authMiddleware, roleMiddleware('admin'));

// Stats
router.get('/stats', adminController.getStats);

// Categories
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Doctors
router.get('/doctors', adminController.getDoctors);
router.post('/doctors', adminController.createDoctor);
router.put('/doctors/:id', adminController.updateDoctor);
router.delete('/doctors/:id', adminController.deleteDoctor);

// Patients
router.get('/patients', adminController.getPatients);
router.delete('/patients/:id', adminController.deletePatient);

// All appointments
router.get('/appointments', adminController.getAllAppointments);

// Offers
router.get('/offers', adminController.getOffers);
router.post('/offers', adminController.createOffer);
router.put('/offers/:id', adminController.updateOffer);
router.delete('/offers/:id', adminController.deleteOffer);

// Quotes
router.get('/quotes', adminController.getQuotes);
router.post('/quotes', adminController.createQuote);
router.put('/quotes/:id', adminController.updateQuote);
router.delete('/quotes/:id', adminController.deleteQuote);

module.exports = router;
