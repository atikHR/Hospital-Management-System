import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { FiUsers, FiActivity, FiCalendar, FiGrid } from 'react-icons/fi';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
          <li><Link to="/admin/dashboard" className="active">📊 Dashboard</Link></li>
          <li><Link to="/admin/doctors">👨‍⚕️ Manage Doctors</Link></li>
          <li><Link to="/admin/categories">📁 Categories</Link></li>
          <li><Link to="/admin/patients">👥 Patients</Link></li>
          <li><Link to="/admin/appointments">📋 Appointments</Link></li>
          <li><Link to="/admin/offers">🎁 Special Offers</Link></li>
          <li><Link to="/admin/gallery">🖼️ Gallery</Link></li>
          <li><Link to="/admin/quotes">📜 Health Quotes</Link></li>
        </ul>
      </aside>

      <main className="dashboard-content">
        <div className="page-header">
          <h2>Admin Dashboard</h2>
          <p>Overview of your hospital management system</p>
        </div>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue"><FiActivity size={22} /></div>
              <div className="stat-info">
                <h3>{stats.totalDoctors}</h3>
                <p>Active Doctors</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><FiUsers size={22} /></div>
              <div className="stat-info">
                <h3>{stats.totalPatients}</h3>
                <p>Registered Patients</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow"><FiCalendar size={22} /></div>
              <div className="stat-info">
                <h3>{stats.todayAppointments}</h3>
                <p>Today's Appointments</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><FiGrid size={22} /></div>
              <div className="stat-info">
                <h3>{stats.totalCategories}</h3>
                <p>Categories</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="page-header" style={{ marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1.3rem' }}>Quick Actions</h2>
        </div>
        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Link to="/admin/doctors">
            <div className="card category-card">
              <div className="category-icon">👨‍⚕️</div>
              <h3>Manage Doctors</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Add, edit, or remove doctors</p>
            </div>
          </Link>
          <Link to="/admin/categories">
            <div className="card category-card">
              <div className="category-icon">📁</div>
              <h3>Categories</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage medical specialties</p>
            </div>
          </Link>
          <Link to="/admin/patients">
            <div className="card category-card">
              <div className="category-icon">👥</div>
              <h3>Patients</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>View and manage patients</p>
            </div>
          </Link>
          <Link to="/admin/appointments">
            <div className="card category-card">
              <div className="category-icon">📋</div>
              <h3>Appointments</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>View all appointments</p>
            </div>
          </Link>
          <Link to="/admin/offers">
            <div className="card category-card">
              <div className="category-icon">🎁</div>
              <h3>Special Offers</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage promotional offers</p>
            </div>
          </Link>
          <Link to="/admin/gallery">
            <div className="card category-card">
              <div className="category-icon">🖼️</div>
              <h3>Gallery</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hospital & facility images</p>
            </div>
          </Link>
          <Link to="/admin/quotes">
            <div className="card category-card">
              <div className="category-icon">📜</div>
              <h3>Health Quotes</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hadiths & scholar quotes</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
