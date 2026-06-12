import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { FiUpload, FiTrash2, FiEdit2, FiImage, FiEye, FiEyeOff, FiPlus, FiX } from 'react-icons/fi';

const ManageGallery = () => {
  const { user } = useAuth();
  const [hospitalImages, setHospitalImages] = useState([]);
  const [facilityImages, setFacilityImages] = useState([]);
  const [activeTab, setActiveTab] = useState('hospital');
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', display_order: 0 });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const [hospitalRes, facilityRes] = await Promise.all([
        api.get('/admin/hospital-images'),
        api.get('/admin/facility-images'),
      ]);
      setHospitalImages(hospitalRes.data);
      setFacilityImages(facilityRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingImage(null);
    setFormData({ title: '', description: '', display_order: 0 });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (img) => {
    setEditingImage(img);
    setFormData({
      title: img.title || '',
      description: img.description || '',
      display_order: img.display_order || 0,
    });
    setImageFile(null);
    setImagePreview(img.image_url);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = activeTab === 'hospital' ? 'hospital-images' : 'facility-images';

    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('description', formData.description);
    fd.append('display_order', formData.display_order);
    if (imageFile) fd.append('image', imageFile);

    try {
      if (editingImage) {
        await api.put(`/admin/${endpoint}/${editingImage.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        if (!imageFile) return alert('Please select an image file.');
        await api.post(`/admin/${endpoint}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowModal(false);
      fetchImages();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving image.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    const endpoint = activeTab === 'hospital' ? 'hospital-images' : 'facility-images';
    try {
      await api.delete(`/admin/${endpoint}/${id}`);
      fetchImages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (img) => {
    const endpoint = activeTab === 'hospital' ? 'hospital-images' : 'facility-images';
    try {
      const fd = new FormData();
      fd.append('is_active', !img.is_active);
      await api.put(`/admin/${endpoint}/${img.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchImages();
    } catch (err) {
      console.error(err);
    }
  };

  const currentImages = activeTab === 'hospital' ? hospitalImages : facilityImages;

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-role">
          <span className="role-badge">Admin</span>
          <span className="user-name">{user?.name}</span>
          <span className="user-email">{user?.email}</span>
        </div>
        <ul className="sidebar-menu">
          <li><Link to="/admin/dashboard">📊 Dashboard</Link></li>
          <li><Link to="/admin/doctors">👨‍⚕️ Manage Doctors</Link></li>
          <li><Link to="/admin/categories">📁 Categories</Link></li>
          <li><Link to="/admin/patients">👥 Patients</Link></li>
          <li><Link to="/admin/appointments">📋 Appointments</Link></li>
          <li><Link to="/admin/offers">🎁 Special Offers</Link></li>
          <li><Link to="/admin/gallery" className="active">🖼️ Gallery</Link></li>
        </ul>
      </aside>

      <main className="dashboard-content">
        <div className="page-header">
          <h2><FiImage style={{ marginRight: '0.5rem' }} /> Gallery Management</h2>
          <p>Manage hospital hero images and facility images</p>
        </div>

        {/* Tabs */}
        <div className="gallery-tabs">
          <button
            className={`gallery-tab ${activeTab === 'hospital' ? 'active' : ''}`}
            onClick={() => setActiveTab('hospital')}
          >
            🏥 Hospital Images ({hospitalImages.length})
          </button>
          <button
            className={`gallery-tab ${activeTab === 'facility' ? 'active' : ''}`}
            onClick={() => setActiveTab('facility')}
          >
            🏗️ Facility Images ({facilityImages.length})
          </button>
        </div>

        <div className="gallery-info">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            {activeTab === 'hospital'
              ? '📌 These images rotate as the hero background on the homepage every 5 seconds.'
              : '📌 These images are shown in the Facilities section on the homepage, rotating every 5 seconds.'}
          </p>
          <button className="btn btn-primary" onClick={openAddModal}>
            <FiPlus /> Add {activeTab === 'hospital' ? 'Hospital' : 'Facility'} Image
          </button>
        </div>

        {/* Image Grid */}
        <div className="gallery-grid">
          {currentImages.length === 0 ? (
            <div className="empty-state">
              <FiImage size={48} />
              <p>No images yet. Add your first {activeTab} image!</p>
            </div>
          ) : (
            currentImages.map((img) => (
              <div key={img.id} className={`gallery-card ${!img.is_active ? 'inactive' : ''}`}>
                <div className="gallery-card-image">
                  <img src={img.image_url} alt={img.title || 'Image'} />
                  <div className="gallery-card-overlay">
                    <button className="gallery-action-btn edit" onClick={() => openEditModal(img)} title="Edit">
                      <FiEdit2 />
                    </button>
                    <button
                      className={`gallery-action-btn ${img.is_active ? 'hide' : 'show'}`}
                      onClick={() => handleToggleActive(img)}
                      title={img.is_active ? 'Hide' : 'Show'}
                    >
                      {img.is_active ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button className="gallery-action-btn delete" onClick={() => handleDelete(img.id)} title="Delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                <div className="gallery-card-info">
                  <h4>{img.title || 'Untitled'}</h4>
                  {img.description && <p>{img.description}</p>}
                  <div className="gallery-card-meta">
                    <span className={`status-badge ${img.is_active ? 'active' : 'inactive'}`}>
                      {img.is_active ? 'Active' : 'Hidden'}
                    </span>
                    <span>Order: {img.display_order}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingImage ? 'Edit' : 'Add'} {activeTab === 'hospital' ? 'Hospital' : 'Facility'} Image</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title {activeTab === 'facility' && <span style={{ color: 'var(--accent)' }}>*</span>}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={activeTab === 'hospital' ? 'e.g. Our Modern Campus' : 'e.g. Emergency Department'}
                    required={activeTab === 'facility'}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the image..."
                  />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FiUpload style={{ marginRight: '0.3rem' }} />
                    Image {!editingImage && <span style={{ color: 'var(--accent)' }}>*</span>}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="form-input"
                    required={!editingImage}
                  />
                </div>
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {editingImage ? 'Update' : 'Upload'} Image
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageGallery;
