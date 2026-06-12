import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiUsers, FiCheckCircle, FiClock, FiActivity, FiPower, FiSend, FiTrash2, FiMessageCircle, FiBell } from 'react-icons/fi';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [chamberTime, setChamberTime] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  useEffect(() => {
    fetchData();
    fetchProfile();
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchData = async () => {
    try {
      const statsRes = await api.get('/doctor/stats');
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const aptsRes = await api.get(`/doctor/appointments?filter=${filter}`);
      setAppointments(aptsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/doctor/profile');
      setProfile(res.data);
      setChamberTime(res.data.chamber_start_time || '');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/doctor/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (appointmentId, status) => {
    try {
      await api.put(`/doctor/appointments/${appointmentId}/status`, { status });
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
      fetchData();
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const toggleChamber = async () => {
    try {
      const res = await api.put('/doctor/chamber/toggle');
      setProfile(prev => ({ ...prev, is_in_chamber: res.data.is_in_chamber }));
      toast.success(res.data.is_in_chamber ? '🟢 You are now IN CHAMBER — patients can see you!' : '🔴 Chamber deactivated');
    } catch (err) {
      toast.error('Failed to toggle chamber status');
    }
  };

  const saveChamberTime = async () => {
    if (!chamberTime) return toast.error('Please set a valid time');
    try {
      await api.put('/doctor/chamber/time', { chamber_start_time: chamberTime });
      setProfile(prev => ({ ...prev, chamber_start_time: chamberTime }));
      toast.success('Chamber start time updated!');
    } catch (err) {
      toast.error('Failed to update chamber time');
    }
  };

  const sendAnnouncement = async () => {
    if (!announcementText.trim()) return toast.error('Please type a message');
    setSendingAnnouncement(true);
    try {
      await api.post('/doctor/announcements', { message: announcementText.trim() });
      toast.success('📢 Announcement sent to all patients!');
      setAnnouncementText('');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to send announcement');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      await api.delete(`/doctor/announcements/${id}`);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-role">
          <span className="role-badge">Doctor</span>
          <span className="user-name">{user?.name}</span>
          <span className="user-email">{user?.email}</span>
        </div>
        <ul className="sidebar-menu">
          <li><a href="/doctor/dashboard" className="active">📊 Dashboard</a></li>
        </ul>
      </aside>

      <main className="dashboard-content">
        <div className="page-header">
          <h2>Doctor Dashboard</h2>
          <p>Manage today's patient queue — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* ===== CHAMBER CONTROL PANEL ===== */}
        <div className="chamber-control-panel">
          <div className="chamber-header">
            <h3><FiPower /> Chamber Control</h3>
            <button
              className={`chamber-toggle-btn ${profile?.is_in_chamber ? 'active' : ''}`}
              onClick={toggleChamber}
            >
              <span className={`chamber-indicator ${profile?.is_in_chamber ? 'online' : 'offline'}`}></span>
              {profile?.is_in_chamber ? 'IN CHAMBER' : 'NOT IN CHAMBER'}
            </button>
          </div>

          <div className="chamber-controls">
            <div className="chamber-time-control">
              <label>Start seeing patients at:</label>
              <div className="chamber-time-input-group">
                <input
                  type="time"
                  value={chamberTime}
                  onChange={(e) => setChamberTime(e.target.value)}
                  className="form-input"
                />
                <button className="btn btn-primary btn-sm" onClick={saveChamberTime}>
                  <FiClock /> Save Time
                </button>
              </div>
              {profile?.chamber_start_time && (
                <p className="chamber-time-current">
                  Currently set: <strong>{profile.chamber_start_time}</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ===== ANNOUNCEMENT SECTION ===== */}
        <div className="announcement-panel">
          <h3><FiBell /> Send Announcement to All Patients</h3>
          <p className="announcement-desc">Broadcast a message to all your patients with appointments today (e.g., break time, delays, etc.)</p>
          <div className="announcement-input-group">
            <textarea
              className="form-input"
              rows="2"
              placeholder='e.g. "I will take a break from 7:00 PM to 8:00 PM. Please wait patiently."'
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={sendAnnouncement}
              disabled={sendingAnnouncement}
            >
              <FiSend /> {sendingAnnouncement ? 'Sending...' : 'Send to All'}
            </button>
          </div>

          {/* Recent announcements */}
          {announcements.length > 0 && (
            <div className="announcement-history">
              <h4>Recent Announcements</h4>
              {announcements.slice(0, 5).map(ann => (
                <div key={ann.id} className="announcement-item">
                  <div className="announcement-content">
                    <FiMessageCircle className="announcement-icon" />
                    <div>
                      <p>{ann.message}</p>
                      <span className="announcement-time">
                        {new Date(ann.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteAnnouncement(ann.id)}
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue"><FiUsers size={22} /></div>
              <div className="stat-info">
                <h3>{stats.total_patients}</h3>
                <p>Total Patients Today</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow"><FiClock size={22} /></div>
              <div className="stat-info">
                <h3>{stats.waiting}</h3>
                <p>Waiting</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><FiActivity size={22} /></div>
              <div className="stat-info">
                <h3>{stats.examining}</h3>
                <p>Currently Examining</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><FiCheckCircle size={22} /></div>
              <div className="stat-info">
                <h3>{stats.done}</h3>
                <p>Done</p>
              </div>
            </div>
          </div>
        )}

        {/* Patient Queue */}
        <div className="table-wrapper">
          <div className="table-header">
            <h3>Patient Queue</h3>
            <div className="table-filters">
              {['all', 'waiting', 'done'].map(f => (
                <button
                  key={f}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'waiting' ? 'Remaining' : 'Done'}
                </button>
              ))}
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>No patients in queue</h3>
              <p>No appointments scheduled for today</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Serial #</th>
                  <th>Patient Name</th>
                  <th>Phone</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(apt => (
                  <tr
                    key={apt.id}
                    className={
                      apt.status === 'currently_examining' ? 'row-examining'
                      : apt.status === 'done' ? 'row-done' : ''
                    }
                  >
                    <td><strong>#{apt.serial_number}</strong></td>
                    <td>{apt.patient_name}</td>
                    <td>{apt.patient_phone || '—'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {apt.notes || '—'}
                    </td>
                    <td><StatusBadge status={apt.status} /></td>
                    <td>
                      <div className="action-btns">
                        {apt.status === 'waiting' && (
                          <button
                            className="btn btn-examining btn-sm"
                            onClick={() => updateStatus(apt.id, 'currently_examining')}
                          >
                            🔵 Examine
                          </button>
                        )}
                        {(apt.status === 'waiting' || apt.status === 'currently_examining') && (
                          <button
                            className="btn btn-done btn-sm"
                            onClick={() => updateStatus(apt.id, 'done')}
                          >
                            ✅ Done
                          </button>
                        )}
                        {apt.status === 'waiting' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => updateStatus(apt.id, 'cancelled')}
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
