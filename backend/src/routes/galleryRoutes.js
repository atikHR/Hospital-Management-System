const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public routes - get active images for homepage
router.get('/hospital-images', galleryController.getActiveHospitalImages);
router.get('/facility-images', galleryController.getActiveFacilityImages);

// Admin routes - full CRUD
router.get('/admin/hospital-images', authMiddleware, roleMiddleware('admin'), galleryController.getHospitalImages);
router.post('/admin/hospital-images', authMiddleware, roleMiddleware('admin'), galleryController.uploadHospitalImage, galleryController.createHospitalImage);
router.put('/admin/hospital-images/:id', authMiddleware, roleMiddleware('admin'), galleryController.uploadHospitalImage, galleryController.updateHospitalImage);
router.delete('/admin/hospital-images/:id', authMiddleware, roleMiddleware('admin'), galleryController.deleteHospitalImage);

router.get('/admin/facility-images', authMiddleware, roleMiddleware('admin'), galleryController.getFacilityImages);
router.post('/admin/facility-images', authMiddleware, roleMiddleware('admin'), galleryController.uploadFacilityImage, galleryController.createFacilityImage);
router.put('/admin/facility-images/:id', authMiddleware, roleMiddleware('admin'), galleryController.uploadFacilityImage, galleryController.updateFacilityImage);
router.delete('/admin/facility-images/:id', authMiddleware, roleMiddleware('admin'), galleryController.deleteFacilityImage);

module.exports = router;
