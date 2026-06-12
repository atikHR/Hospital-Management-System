import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

const ManageDoctors = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    category_id: '', specialty: '', bio: '', qualification: '',
    experience_years: '', avg_consult_time: '10',
    available_days: 'Mon,Tue,Wed,Thu,Fri',
    start_time: '09:00', end_time: '17:00', max_patients_per_day: '30'
  });

  useEffect(() => {
    fetchDoctors();
    fetchCategories();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/admin/doctors');
      setDoctors(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingDoctor(null);
    setForm({
      name: '', email: '', password: '', phone: '',
      category_id: '', specialty: '', bio: '', qualification: '',
      experience_years: '', avg_consult_time: '10',
      available_days: 'Mon,Tue,Wed,Thu,Fri',
      start_time: '09:00', end_time: '17:00', max_patients_per_day: '30'
    });
    setShowModal(true);
  };

  const openEditModal = (doc) => {
    setEditingDoctor(doc);
    setForm({
      name: doc.name || '', email: doc.email || '', password: '', phone: doc.phone || '',
      category_id: doc.category_id || '', specialty: doc.specialty || '',
      bio: doc.bio || '', qualification: doc.qualification || '',
      experience_years: doc.experience_years || '',
      avg_consult_time: doc.avg_consult_time || '10',
      available_days: doc.available_days || 'Mon,Tue,Wed,Thu,Fri',
      start_time: doc.start_time?.slice(0, 5) || '09:00',
      end_time: doc.end_time?.slice(0, 5) || '17:00',
      max_patients_per_day: doc.max_patients_per_day || '30'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await api.put(`/admin/doctors/${editingDoctor.id}`, form);
        toast.success('Doctor updated successfully');
      } else {
        if (!form.password) {
          toast.error('Password is required for new doctor');
          return;
        }
        await api.post('/admin/doctors', form);
        toast.success('Doctor created successfully');
      }
      setShowModal(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const deleteDoctor = async (id) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    try {
      await api.delete(`/admin/doctors/${id}`);
      toast.success('Doctor removed');
      fetchDoctors();
    } catch (err) {
      toast.error('Failed to delete doctor');
    }
  };

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
          <li><Link to="/admin/doctors" className="active">👨‍⚕️ Manage Doctors</Link></li>
          <li><Link to="/admin/categories">📁 Categories</Link></li>
          <li><Link to="/admin/patients">👥 Patients</Link></li>
          <li><Link to="/admin/appointments">📋 Appointments</Link></li>
          <li><Link to="/admin/offers">🎁 Special Offers</Link></li>
        </ul>
      </aside>

      <main className="dashboard-content">
        <div className="page-header">
          <h2>Manage Doctors</h2>
          <p>Add, edit, or remove doctors from the system</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <button className="btn btn-primary" onClick={openAddModal}>
            <FiPlus /> Add New Doctor
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Category</th>
                <th>Specialty</th>
                <th>Experience</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map(doc => (
                <tr key={doc.id}>
                  <td><strong>{doc.name}</strong></td>
                  <td>{doc.email}</td>
                  <td><span className="category-count">{doc.category_name || '—'}</span></td>
                  <td>{doc.specialty || '—'}</td>
                  <td>{doc.experience_years} yrs</td>
                  <td>
                    <span className={`status-badge ${doc.is_active ? 'done' : 'cancelled'}`}>
                      <span className={`status-dot ${doc.is_active ? 'done' : 'cancelled'}`}></span>
                      {doc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(doc)}>
                        <FiEdit />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteDoctor(doc.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required disabled={!!editingDoctor} />
                </div>
                {!editingDoctor && (
                  <div className="form-group">
                    <label>Password *</label>
                    <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Temporary password" required />
                  </div>
                )}
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category_id" value={form.category_id} onChange={handleChange}>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Specialty</label>
                  <input type="text" name="specialty" value={form.specialty} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Qualification</label>
                  <input type="text" name="qualification" value={form.qualification} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea name="bio" value={form.bio} onChange={handleChange} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Experience (years)</label>
                    <input type="number" name="experience_years" value={form.experience_years} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Avg Consult Time (min)</label>
                    <input type="number" name="avg_consult_time" value={form.avg_consult_time} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Start Time</label>
                    <input type="time" name="start_time" value={form.start_time} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input type="time" name="end_time" value={form.end_time} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Available Days</label>
                  <input type="text" name="available_days" value={form.available_days} onChange={handleChange} placeholder="Mon,Tue,Wed,Thu,Fri" />
                </div>
                <div className="form-group">
                  <label>Max Patients/Day</label>
                  <input type="number" name="max_patients_per_day" value={form.max_patients_per_day} onChange={handleChange} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingDoctor ? 'Update' : 'Create'} Doctor</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageDoctors;
