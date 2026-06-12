const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const resultStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'test-results');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `result-${req.user.id}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  if (ext) cb(null, true);
  else cb(new Error('Only image, PDF, or document files are allowed.'));
};

exports.uploadMiddleware = multer({
  storage: resultStorage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
}).single('file');

// Get all test results for the logged-in patient
exports.getMyResults = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tr.*, du.name as doctor_name
      FROM test_results tr
      LEFT JOIN doctors d ON tr.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE tr.patient_id = $1
      ORDER BY tr.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Upload a new test result (with optional file)
exports.uploadResult = async (req, res) => {
  try {
    const { title, description, test_date, test_type, result_value } = req.body;

    if (!title) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Title is required.' });
    }

    const file_url = req.file ? `/uploads/test-results/${req.file.filename}` : null;
    const file_name = req.file ? req.file.originalname : null;
    const file_size = req.file ? req.file.size : null;

    const result = await pool.query(
      `INSERT INTO test_results (patient_id, title, description, test_date, test_type, result_value, file_url, file_name, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'patient') RETURNING *`,
      [req.user.id, title, description || null, test_date || null, test_type || null, result_value || null, file_url, file_name, file_size]
    );

    res.status(201).json({ message: 'Result uploaded successfully.', result: result.rows[0] });
  } catch (error) {
    console.error('Upload result error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete a test result
exports.deleteResult = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM test_results WHERE id = $1 AND patient_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    // Delete physical file if exists
    const row = existing.rows[0];
    if (row.file_url) {
      const filePath = path.join(__dirname, '..', '..', row.file_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM test_results WHERE id = $1', [id]);
    res.json({ message: 'Result deleted.' });
  } catch (error) {
    console.error('Delete result error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
