import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  FiUser, FiUpload, FiTrash2, FiDownload,
  FiCalendar, FiActivity, FiChevronDown, FiChevronUp, FiX, FiMenu
} from 'react-icons/fi';

const BACKEND = 'http://localhost:5001';

const PatientProfile = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: '', description: '', test_date: '', test_type: '', result_value: ''
  });
  const [expandedResult, setExpandedResult] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', phone: user.phone || '' });
    }
    fetchResults();
  }, [user]);

  const fetchResults = async () => {
    try {
      const res = await api.get('/results');
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/profile', profileForm);
      if (setUser) setUser(prev => ({ ...prev, ...res.data }));
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };

  const handleUploadFormChange = (e) => {
    setUploadForm({ ...uploadForm, [e.target.name]: e.target.value });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.title) {
      toast.error('Title is required');
      return;
    }
    setUploading(true);
    try {
      const data = new FormData();
      Object.entries(uploadForm).forEach(([k, v]) => { if (v) data.append(k, v); });
      if (selectedFile) data.append('file', selectedFile);

      await api.post('/results', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Result uploaded successfully');
      setShowUploadForm(false);
      setSelectedFile(null);
      setUploadForm({ title: '', description: '', test_date: '', test_type: '', result_value: '' });
      fetchResults();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this test result?')) return;
    try {
      await api.delete(`/results/${id}`);
      toast.success('Result deleted');
      fetchResults();
    } catch (err) {
      toast.error('Failed to delete result');
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return '📄';
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (ext === 'pdf') return '📕';
    return '📄';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const SidebarContent = () => (
    <>
      <div className="sidebar-role">
        <span className="role-badge">Patient</span>
        <span className="user-name">{user?.name}</span>
        <span className="user-email">{user?.email}</span>
      </div>
      <ul className="sidebar-menu">
        <li><Link to="/patient/dashboard" onClick={() => setSidebarOpen(false)}>📊 Dashboard</Link></li>
        <li><Link to="/patient/profile" className="active" onClick={() => setSidebarOpen(false)}>👤 My Profile</Link></li>
        <li><Link to="/doctors" onClick={() => setSidebarOpen(false)}>🔍 Find Doctors</Link></li>
      </ul>
    </>
  );

  return (
    <div className="dashboard">
      <aside className="sidebar"><SidebarContent /></aside>

      <div className={`sidebar-drawer-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className={`sidebar-drawer ${sidebarOpen ? 'open' : ''}`}><SidebarContent /></div>

      <main className="dashboard-content">
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>
          <FiMenu /> Menu
        </button>
        <div className="page-header">
          <h2>My Profile</h2>
          <p>Manage your personal details and medical records</p>
        </div>

        {/* ===== PROFILE EDIT ===== */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-avatar">{user?.name?.charAt(0) || '?'}</div>
            <div>
              <h3>{user?.name}</h3>
              <span className="role-badge" style={{ fontSize: '0.75rem' }}>Patient</span>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="profile-form">
            <div className="form-row-2">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="Your phone number"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email (cannot be changed)</label>
              <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              <FiUser /> {savingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* ===== TEST RESULTS ===== */}
        <div className="table-wrapper" style={{ marginTop: '2rem' }}>
          <div className="table-header">
            <h3><FiActivity style={{ marginRight: 8 }} />My Test Results</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowUploadForm(v => !v)}>
              <FiUpload /> Upload Result
            </button>
          </div>

          {/* Upload form */}
          {showUploadForm && (
            <div className="upload-result-form">
              <div className="upload-form-header">
                <h4>Upload Test Result</h4>
                <button className="btn-icon" onClick={() => setShowUploadForm(false)}><FiX /></button>
              </div>
              <form onSubmit={handleUpload}>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={uploadForm.title}
                      onChange={handleUploadFormChange}
                      placeholder="e.g. Blood Test, X-Ray, MRI"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Test Type</label>
                    <select name="test_type" value={uploadForm.test_type} onChange={handleUploadFormChange}>
                      <option value="">Select type</option>
                      <option value="Blood Test">Blood Test</option>
                      <option value="Urine Test">Urine Test</option>
                      <option value="X-Ray">X-Ray</option>
                      <option value="MRI">MRI</option>
                      <option value="CT Scan">CT Scan</option>
                      <option value="Ultrasound">Ultrasound</option>
                      <option value="ECG">ECG</option>
                      <option value="Biopsy">Biopsy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Test Date</label>
                    <input
                      type="date"
                      name="test_date"
                      value={uploadForm.test_date}
                      onChange={handleUploadFormChange}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label>Result Summary (optional)</label>
                    <input
                      type="text"
                      name="result_value"
                      value={uploadForm.result_value}
                      onChange={handleUploadFormChange}
                      placeholder="e.g. Normal, Abnormal, 120/80 mmHg"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes / Description</label>
                  <textarea
                    name="description"
                    value={uploadForm.description}
                    onChange={handleUploadFormChange}
                    placeholder="Any additional details about this test..."
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Attach File (image, PDF, doc — max 20MB)</label>
                  <div
                    className="file-drop-zone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiUpload size={24} />
                    <span>{selectedFile ? selectedFile.name : 'Click to select or drag & drop'}</span>
                    {selectedFile && (
                      <span className="file-size-label">{formatFileSize(selectedFile.size)}</span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUploadForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    <FiUpload /> {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Results list */}
          {loadingResults ? (
            <div className="loading-container" style={{ minHeight: 120 }}><div className="spinner"></div></div>
          ) : results.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 0' }}>
              <div className="icon">🧪</div>
              <h3>No test results yet</h3>
              <p>Upload your medical test results to keep them all in one place</p>
            </div>
          ) : (
            <div className="results-list">
              {results.map(r => (
                <div key={r.id} className="result-card">
                  <div className="result-card-main" onClick={() => setExpandedResult(expandedResult === r.id ? null : r.id)}>
                    <div className="result-icon">{getFileIcon(r.file_name)}</div>
                    <div className="result-info">
                      <div className="result-title">{r.title}</div>
                      <div className="result-meta">
                        {r.test_type && <span className="result-tag">{r.test_type}</span>}
                        {r.test_date && (
                          <span className="result-date">
                            <FiCalendar size={11} /> {new Date(r.test_date).toLocaleDateString()}
                          </span>
                        )}
                        {r.result_value && <span className="result-value-label">Result: {r.result_value}</span>}
                        {r.doctor_name && <span className="result-doctor">Dr. {r.doctor_name}</span>}
                      </div>
                    </div>
                    <div className="result-actions" onClick={e => e.stopPropagation()}>
                      {r.file_url && (
                        <a
                          href={`${BACKEND}${r.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="View file"
                        >
                          <FiDownload />
                        </a>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)} title="Delete">
                        <FiTrash2 />
                      </button>
                      <span className="expand-btn">
                        {expandedResult === r.id ? <FiChevronUp /> : <FiChevronDown />}
                      </span>
                    </div>
                  </div>
                  {expandedResult === r.id && (
                    <div className="result-expanded">
                      {r.description && <p className="result-description">{r.description}</p>}
                      {r.file_url && r.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                        <img
                          src={`${BACKEND}${r.file_url}`}
                          alt={r.title}
                          className="result-image-preview"
                        />
                      )}
                      <div className="result-expanded-meta">
                        <span>Uploaded: {new Date(r.created_at).toLocaleDateString()}</span>
                        {r.file_name && <span>File: {r.file_name} {r.file_size ? `(${formatFileSize(r.file_size)})` : ''}</span>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientProfile;
