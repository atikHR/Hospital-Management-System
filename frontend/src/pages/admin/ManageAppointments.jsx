import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import api from '../../api/axios';

const ManageAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/admin/appointments');
      setAppointments(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
          <li><Link to="/admin/patients">👥 Patients</Link></li>
          <li><Link to="/admin/appointments" className="active">📋 Appointments</Link></li>
          <li><Link to="/admin/offers">🎁 Special Offers</Link></li>
        </ul>
      </aside>

      <main className="dashboard-content">
        <div className="page-header">
          <h2>All Appointments</h2>
          <p>{appointments.length} total appointments</p>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Category</th>
                <th>Date</th>
                <th>Serial #</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(apt => (
                <tr key={apt.id} className={apt.status === 'currently_examining' ? 'row-examining' : apt.status === 'done' ? 'row-done' : ''}>
                  <td>#{apt.id}</td>
                  <td><strong>{apt.patient_name}</strong></td>
                  <td>{apt.doctor_name}</td>
                  <td><span className="category-count">{apt.category_name || '—'}</span></td>
                  <td>{new Date(apt.appointment_date).toLocaleDateString()}</td>
                  <td>#{apt.serial_number}</td>
                  <td><StatusBadge status={apt.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {appointments.length === 0 && (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>No appointments yet</h3>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageAppointments;
