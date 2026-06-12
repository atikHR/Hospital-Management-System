import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiTrash2 } from 'react-icons/fi';

const ManagePatients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/admin/patients');
      setPatients(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const deletePatient = async (id) => {
    if (!confirm('Are you sure you want to remove this patient?')) return;
    try {
      await api.delete(`/admin/patients/${id}`);
      toast.success('Patient removed');
      fetchPatients();
    } catch (err) {
      toast.error('Failed to delete patient');
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
          <li><Link to="/admin/doctors">👨‍⚕️ Manage Doctors</Link></li>
          <li><Link to="/admin/categories">📁 Categories</Link></li>
          <li><Link to="/admin/patients" className="active">👥 Patients</Link></li>
          <li><Link to="/admin/appointments">📋 Appointments</Link></li>
          <li><Link to="/admin/offers">🎁 Special Offers</Link></li>
        </ul>
      </aside>

      <main className="dashboard-content">
        <div className="page-header">
          <h2>Manage Patients</h2>
          <p>{patients.length} registered patients</p>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Registered</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.email}</td>
                  <td>{p.phone || '—'}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => deletePatient(p.id)}>
                      <FiTrash2 /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {patients.length === 0 && (
            <div className="empty-state">
              <div className="icon">👥</div>
              <h3>No patients registered yet</h3>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagePatients;
