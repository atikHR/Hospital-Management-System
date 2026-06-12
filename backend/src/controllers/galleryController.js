const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for hospital images
const hospitalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'hospital-images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `hospital-${Date.now()}${ext}`);
  }
});

// Multer config for facility images
const facilityStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'facility-images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `facility-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only image files are allowed.'));
};

exports.uploadHospitalImage = multer({ storage: hospitalStorage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }).single('image');
exports.uploadFacilityImage = multer({ storage: facilityStorage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }).single('image');

// ---- HOSPITAL IMAGES ----

exports.getHospitalImages = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hospital_images ORDER BY display_order ASC, created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get hospital images error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getActiveHospitalImages = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hospital_images WHERE is_active = true ORDER BY display_order ASC, created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get active hospital images error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.createHospitalImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image file is required.' });

    const { title, description, display_order } = req.body;
    const image_url = `/uploads/hospital-images/${req.file.filename}`;

    const result = await pool.query(
      'INSERT INTO hospital_images (title, description, image_url, display_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [title || null, description || null, image_url, display_order || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create hospital image error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateHospitalImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, display_order, is_active } = req.body;

    let image_url = undefined;
    if (req.file) {
      image_url = `/uploads/hospital-images/${req.file.filename}`;
      // Delete old image
      const old = await pool.query('SELECT image_url FROM hospital_images WHERE id = $1', [id]);
      if (old.rows.length > 0 && old.rows[0].image_url) {
        const oldPath = path.join(__dirname, '..', '..', old.rows[0].image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const result = await pool.query(
      `UPDATE hospital_images SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        display_order = COALESCE($3, display_order),
        is_active = COALESCE($4, is_active),
        image_url = COALESCE($5, image_url)
      WHERE id = $6 RETURNING *`,
      [title, description, display_order !== undefined ? display_order : null, is_active !== undefined ? is_active : null, image_url || null, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Image not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update hospital image error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteHospitalImage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM hospital_images WHERE id = $1 RETURNING image_url', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Image not found.' });

    // Delete file
    const filePath = path.join(__dirname, '..', '..', result.rows[0].image_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'Hospital image deleted.' });
  } catch (error) {
    console.error('Delete hospital image error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ---- FACILITY IMAGES ----

exports.getFacilityImages = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM facility_images ORDER BY display_order ASC, created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get facility images error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getActiveFacilityImages = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM facility_images WHERE is_active = true ORDER BY display_order ASC, created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get active facility images error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.createFacilityImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image file is required.' });

    const { title, description, display_order } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });

    const image_url = `/uploads/facility-images/${req.file.filename}`;

    const result = await pool.query(
      'INSERT INTO facility_images (title, description, image_url, display_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description || null, image_url, display_order || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create facility image error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateFacilityImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, display_order, is_active } = req.body;

    let image_url = undefined;
    if (req.file) {
      image_url = `/uploads/facility-images/${req.file.filename}`;
      const old = await pool.query('SELECT image_url FROM facility_images WHERE id = $1', [id]);
      if (old.rows.length > 0 && old.rows[0].image_url) {
        const oldPath = path.join(__dirname, '..', '..', old.rows[0].image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const result = await pool.query(
      `UPDATE facility_images SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        display_order = COALESCE($3, display_order),
        is_active = COALESCE($4, is_active),
        image_url = COALESCE($5, image_url)
      WHERE id = $6 RETURNING *`,
      [title, description, display_order !== undefined ? display_order : null, is_active !== undefined ? is_active : null, image_url || null, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Image not found.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update facility image error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteFacilityImage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM facility_images WHERE id = $1 RETURNING image_url', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Image not found.' });

    const filePath = path.join(__dirname, '..', '..', result.rows[0].image_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'Facility image deleted.' });
  } catch (error) {
    console.error('Delete facility image error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
