import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

const ManageOffers = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', badge: 'NEW', color: '#16C79A', link: '' });

  useEffect(() => { fetchOffers(); }, []);

  const fetchOffers = async () => {
    try {
      const res = await api.get('/admin/offers');
      setOffers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openAddModal = () => {
    setEditing(null);
    setForm({ title: '', description: '', badge: 'NEW', color: '#16C79A', link: '' });
    setShowModal(true);
  };

  const openEditModal = (offer) => {
    setEditing(offer);
    setForm({
      title: offer.title || '', description: offer.description || '',
      badge: offer.badge || 'NEW', color: offer.color || '#16C79A', link: offer.link || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/offers/${editing.id}`, form);
        toast.success('Offer updated');
      } else {
        await api.post('/admin/offers', form);
        toast.success('Offer created');
      }
      setShowModal(false);
      fetchOffers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const toggleOffer = async (offer) => {
    try {
      await api.put(`/admin/offers/${offer.id}`, { is_active: !offer.is_active });
      toast.success(offer.is_active ? 'Offer deactivated' : 'Offer activated');
      fetchOffers();
    } catch (err) { toast.error('Toggle failed'); }
  };

  const deleteOffer = async (id) => {
    if (!confirm('Delete this offer?')) return;
    try {
      await api.delete(`/admin/offers/${id}`);
      toast.success('Offer deleted');
      fetchOffers();
    } catch (err) { toast.error('Delete failed'); }
  };

  const colorPresets = ['#16C79A', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

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
          <li><Link to="/admin/offers" className="active">🎁 Special Offers</Link></li>
        </ul>
      </aside>

      <main className="dashboard-content">
        <div className="page-header">
          <h2>Special Offers</h2>
          <p>Create promotional offers displayed on the homepage banner</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <button className="btn btn-primary" onClick={openAddModal}>
            <FiPlus /> Create Offer
          </button>
        </div>

        <div className="cards-grid">
          {offers.map(offer => (
            <div className="card" key={offer.id} style={{ opacity: offer.is_active ? 1 : 0.5, transition: 'opacity 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span className="offer-badge" style={{ background: offer.color }}>{offer.badge}</span>
                <span style={{ fontSize: '0.75rem', color: offer.is_active ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {offer.is_active ? '● Active' : '○ Inactive'}
                </span>
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.05rem' }}>{offer.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{offer.description || 'No description'}</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(offer)}><FiEdit /> Edit</button>
                <button className="btn btn-sm" onClick={() => toggleOffer(offer)} style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>
                  {offer.is_active ? <FiToggleRight /> : <FiToggleLeft />} {offer.is_active ? 'Disable' : 'Enable'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteOffer(offer.id)}><FiTrash2 /></button>
              </div>
            </div>
          ))}
        </div>

        {offers.length === 0 && (
          <div className="empty-state">
            <div className="icon">🎁</div>
            <h3>No offers yet</h3>
            <p>Create promotional offers that appear on the homepage</p>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>{editing ? 'Edit Offer' : 'Create Offer'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title *</label>
                  <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Free Health Checkup" required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} placeholder="Brief description of the offer..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Badge Text</label>
                    <input type="text" name="badge" value={form.badge} onChange={handleChange} placeholder="NEW, SALE, FREE..." />
                  </div>
                  <div className="form-group">
                    <label>Badge Color</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {colorPresets.map(c => (
                        <button type="button" key={c}
                          onClick={() => setForm({...form, color: c})}
                          style={{
                            width: 32, height: 32, borderRadius: '50%',
                            border: form.color === c ? '3px solid white' : '2px solid transparent',
                            background: c, cursor: 'pointer',
                            transition: 'all 0.2s', transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Link (optional)</label>
                  <input type="text" name="link" value={form.link} onChange={handleChange} placeholder="/doctors" />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'} Offer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageOffers;
