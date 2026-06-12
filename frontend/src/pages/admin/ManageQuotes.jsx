import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiBookOpen } from 'react-icons/fi';

const ManageQuotes = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [formData, setFormData] = useState({ quote_text: '', author: '', source: '', category: 'general', display_order: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const res = await api.get('/admin/quotes');
      setQuotes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingQuote(null);
    setFormData({ quote_text: '', author: '', source: '', category: 'general', display_order: 0 });
    setShowModal(true);
  };

  const openEditModal = (quote) => {
    setEditingQuote(quote);
    setFormData({
      quote_text: quote.quote_text,
      author: quote.author,
      source: quote.source || '',
      category: quote.category || 'general',
      display_order: quote.display_order || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQuote) {
        await api.put(`/admin/quotes/${editingQuote.id}`, formData);
      } else {
        await api.post('/admin/quotes', formData);
      }
      setShowModal(false);
      fetchQuotes();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving quote.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this quote?')) return;
    try {
      await api.delete(`/admin/quotes/${id}`);
      fetchQuotes();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (quote) => {
    try {
      await api.put(`/admin/quotes/${quote.id}`, { is_active: !quote.is_active });
      fetchQuotes();
    } catch (err) {
      console.error(err);
    }
  };

  const categoryLabel = (cat) => {
    switch (cat) {
      case 'hadith': return '🕌 Hadith';
      case 'scholar': return '📖 Scholar';
      default: return '💚 General';
    }
  };

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
          <li><Link to="/admin/gallery">🖼️ Gallery</Link></li>
          <li><Link to="/admin/quotes" className="active">📜 Health Quotes</Link></li>
        </ul>
      </aside>

      <main className="dashboard-content">
        <div className="page-header">
          <h2><FiBookOpen style={{ marginRight: '0.5rem' }} /> Health Quotes</h2>
          <p>Manage health quotes, hadiths, and scholar quotes displayed on the homepage</p>
        </div>

        <div className="gallery-info">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            📌 These quotes rotate on the homepage near the hero section. Add hadiths, scholar quotes, and general health wisdom.
          </p>
          <button className="btn btn-primary" onClick={openAddModal}>
            <FiPlus /> Add Quote
          </button>
        </div>

        <div className="table-wrapper" style={{ marginTop: '1rem' }}>
          {quotes.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📜</div>
              <h3>No quotes yet</h3>
              <p>Add health quotes, hadiths, and scholar quotations</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Quote</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map(q => (
                  <tr key={q.id} style={{ opacity: q.is_active ? 1 : 0.5 }}>
                    <td style={{ maxWidth: '350px' }}>
                      <div style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
                        "{q.quote_text}"
                        {q.source && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>Source: {q.source}</div>}
                      </div>
                    </td>
                    <td><strong>{q.author}</strong></td>
                    <td>
                      <span className={`quote-category-badge ${q.category}`}>
                        {categoryLabel(q.category)}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`status-badge ${q.is_active ? 'active' : 'inactive'}`}
                        onClick={() => toggleActive(q)}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        {q.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(q)}>
                          <FiEdit2 /> Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingQuote ? 'Edit' : 'Add'} Health Quote</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Quote Text <span style={{ color: 'var(--accent)' }}>*</span></label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={formData.quote_text}
                    onChange={(e) => setFormData({ ...formData, quote_text: e.target.value })}
                    placeholder="Enter the quote text..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Author <span style={{ color: 'var(--accent)' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g. Prophet Muhammad (ﷺ) / Ibn Sina / WHO"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Source (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="e.g. Sahih Bukhari / Quran 26:80"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="hadith">🕌 Hadith</option>
                    <option value="scholar">📖 Scholar</option>
                    <option value="general">💚 General Health</option>
                  </select>
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
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {editingQuote ? 'Update' : 'Add'} Quote
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

export default ManageQuotes;
