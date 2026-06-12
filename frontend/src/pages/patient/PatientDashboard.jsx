import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import StatusBadge from '../../components/StatusBadge';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiCalendar, FiClock, FiXCircle, FiBell, FiActivity, FiMenu, FiX } from 'react-icons/fi';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorChamberInfo, setDoctorChamberInfo] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveAnnouncements, setLiveAnnouncements] = useState([]);
  const {
    joinPatientRoom, joinDoctorQueue,
    onStatusUpdate, onQueueMoved,
    onDoctorAnnouncement, onDoctorChamberUpdate, onDoctorChamberTimeUpdate,
    offStatusUpdate, offQueueMoved,
    offDoctorAnnouncement, offDoctorChamberUpdate, offDoctorChamberTimeUpdate,
  } = useSocket();

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (user) {
      joinPatientRoom(user.id);
    }

    onStatusUpdate((data) => {
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === data.appointmentId
            ? { ...apt, status: data.status }
            : apt
        )
      );
      toast.success(`Appointment #${data.serialNumber} status: ${data.status.replace('_', ' ')}`);
      fetchAppointments();
    });

    onQueueMoved((data) => {
      fetchAppointments();
    });

    onDoctorAnnouncement((data) => {
      setLiveAnnouncements(prev => [data, ...prev].slice(0, 10));
      toast(
        `📢 Dr. ${data.doctorName}: ${data.message}`,
        { duration: 8000, icon: '🔔', style: { background: '#0d1425', color: '#f0f0f0', border: '1px solid rgba(22,199,154,0.3)' } }
      );
    });

    onDoctorChamberUpdate((data) => {
      setDoctorChamberInfo(prev => ({
        ...prev,
        [data.doctorId]: { ...prev[data.doctorId], is_in_chamber: data.isInChamber },
      }));
      toast(
        data.isInChamber ? '🟢 Doctor is now in chamber!' : '🔴 Doctor left the chamber',
        { duration: 5000, style: { background: '#0d1425', color: '#f0f0f0', border: '1px solid rgba(22,199,154,0.3)' } }
      );
    });

    onDoctorChamberTimeUpdate((data) => {
      setDoctorChamberInfo(prev => ({
        ...prev,
        [data.doctorId]: { ...prev[data.doctorId], chamber_start_time: data.chamberStartTime },
      }));
    });

    return () => {
      offStatusUpdate();
      offQueueMoved();
      offDoctorAnnouncement();
      offDoctorChamberUpdate();
      offDoctorChamberTimeUpdate();
    };
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/my');
      setAppointments(res.data);
      // Join doctor queue rooms for real-time updates
      const doctorIds = new Set();
      res.data.forEach(apt => {
        if (apt.status === 'waiting' || apt.status === 'currently_examining') {
          joinDoctorQueue(apt.doctor_id);
          doctorIds.add(apt.doctor_id);
        }
      });
      // Fetch chamber info for each doctor
      doctorIds.forEach(async (doctorId) => {
        try {
          const chamberRes = await api.get(`/doctors/${doctorId}/chamber-info`);
          setDoctorChamberInfo(prev => ({
            ...prev,
            [doctorId]: chamberRes.data,
          }));
        } catch (err) { /* ignore */ }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const todayAppointments = appointments.filter(
    apt => apt.appointment_date?.split('T')[0] === new Date().toISOString().split('T')[0]
  );

  const activeAppointment = todayAppointments.find(
    apt => apt.status === 'waiting' || apt.status === 'currently_examining'
  );

  // Gather all announcements from all doctors
  const allAnnouncements = [];
  Object.entries(doctorChamberInfo).forEach(([doctorId, info]) => {
    if (info.announcements) {
      info.announcements.forEach(ann => {
        allAnnouncements.push({ ...ann, doctorId });
      });
    }
  });
  // Merge with live announcements
  const mergedAnnouncements = [...liveAnnouncements, ...allAnnouncements]
    .filter((ann, i, arr) => arr.findIndex(a => a.message === ann.message && a.doctorId === ann.doctorId) === i)
    .slice(0, 10);

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  const SidebarContent = () => (
    <>
      <div className="sidebar-role">
        <span className="role-badge">Patient</span>
        <span className="user-name">{user?.name}</span>
        <span className="user-email">{user?.email}</span>
      </div>
      <ul className="sidebar-menu">
        <li><Link to="/patient/dashboard" className="active" onClick={() => setSidebarOpen(false)}>📊 Dashboard</Link></li>
        <li><Link to="/patient/profile" onClick={() => setSidebarOpen(false)}>👤 My Profile</Link></li>
        <li><Link to="/doctors" onClick={() => setSidebarOpen(false)}>🔍 Find Doctors</Link></li>
      </ul>
    </>
  );

  return (
    <div className="dashboard">
      {/* Desktop sidebar */}
      <aside className="sidebar"><SidebarContent /></aside>

      {/* Mobile sidebar drawer */}
      <div className={`sidebar-drawer-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className={`sidebar-drawer ${sidebarOpen ? 'open' : ''}`}>
        <SidebarContent />
      </div>

      <main className="dashboard-content">
        {/* Mobile sidebar toggle */}
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>
          <FiMenu /> Menu
        </button>
        <div className="page-header">
          <h2>My Dashboard</h2>
          <p>Track your appointments and queue status</p>
        </div>

        {/* ===== DOCTOR CHAMBER STATUS (for active appointments) ===== */}
        {activeAppointment && doctorChamberInfo[activeAppointment.doctor_id] && (
          <div className="doctor-chamber-status-card">
            <div className="chamber-status-header">
              <FiActivity />
              <h3>Dr. {activeAppointment.doctor_name} — Chamber Status</h3>
            </div>
            <div className="chamber-status-details">
              <div className={`chamber-live-status ${doctorChamberInfo[activeAppointment.doctor_id]?.is_in_chamber ? 'online' : 'offline'}`}>
                <span className={`chamber-dot ${doctorChamberInfo[activeAppointment.doctor_id]?.is_in_chamber ? 'online' : 'offline'}`}></span>
                {doctorChamberInfo[activeAppointment.doctor_id]?.is_in_chamber
                  ? 'Doctor is IN CHAMBER now'
                  : 'Doctor is NOT in chamber yet'}
              </div>
              {doctorChamberInfo[activeAppointment.doctor_id]?.chamber_start_time && (
                <div className="chamber-time-display">
                  <FiClock />
                  <span>
                    Starts seeing patients at: <strong>{doctorChamberInfo[activeAppointment.doctor_id].chamber_start_time}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== DOCTOR ANNOUNCEMENTS ===== */}
        {mergedAnnouncements.length > 0 && (
          <div className="patient-announcements">
            <div className="announcements-header">
              <FiBell />
              <h3>Doctor Announcements</h3>
            </div>
            <div className="announcements-list">
              {mergedAnnouncements.map((ann, i) => (
                <div key={i} className="patient-announcement-item">
                  <div className="announcement-dot"></div>
                  <div>
                    <p className="announcement-msg">{ann.message}</p>
                    <span className="announcement-meta">
                      {ann.doctorName ? `Dr. ${ann.doctorName}` : ''} • {ann.createdAt ? new Date(ann.createdAt).toLocaleTimeString() : ann.created_at ? new Date(ann.created_at).toLocaleTimeString() : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Queue Tracker */}
        {activeAppointment && (
          <div className="queue-tracker">
            <div className="queue-label">Your Queue Position</div>
            <div className="queue-position">#{activeAppointment.serial_number}</div>
            <div className="queue-label" style={{ marginBottom: '0.5rem' }}>
              Dr. {activeAppointment.doctor_name} — {activeAppointment.specialty}
            </div>
            <StatusBadge status={activeAppointment.status} />
            <div className="wait-time" style={{ marginTop: '1rem' }}>
              {activeAppointment.waitInfo?.estimatedText || 'Calculating...'}
            </div>
            {activeAppointment.waitInfo?.position > 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {activeAppointment.waitInfo.position} patient(s) ahead of you
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><FiCalendar size={22} /></div>
            <div className="stat-info">
              <h3>{appointments.length}</h3>
              <p>Total Appointments</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow"><FiClock size={22} /></div>
            <div className="stat-info">
              <h3>{appointments.filter(a => a.status === 'waiting').length}</h3>
              <p>Waiting</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><FiCalendar size={22} /></div>
            <div className="stat-info">
              <h3>{appointments.filter(a => a.status === 'done').length}</h3>
              <p>Completed</p>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="table-wrapper">
          <div className="table-header">
            <h3>My Appointments</h3>
            <Link to="/doctors">
              <button className="btn btn-primary btn-sm">
                <FiCalendar /> Book New
              </button>
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>No appointments yet</h3>
              <p>Browse our doctors and book your first appointment</p>
              <Link to="/doctors">
                <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Find a Doctor</button>
              </Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Serial #</th>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Date</th>
                  <th>Chamber</th>
                  <th>Status</th>
                  <th>Wait Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(apt => (
                  <tr key={apt.id} className={apt.status === 'currently_examining' ? 'row-examining' : apt.status === 'done' ? 'row-done' : ''}>
                    <td><strong>#{apt.serial_number}</strong></td>
                    <td>{apt.doctor_name}</td>
                    <td>{apt.specialty}</td>
                    <td>{new Date(apt.appointment_date).toLocaleDateString()}</td>
                    <td>
                      {doctorChamberInfo[apt.doctor_id] ? (
                        <span className={`chamber-badge ${doctorChamberInfo[apt.doctor_id]?.is_in_chamber ? 'active' : 'inactive'}`}>
                          <span className={`chamber-badge-dot ${doctorChamberInfo[apt.doctor_id]?.is_in_chamber ? 'online' : 'offline'}`}></span>
                          {doctorChamberInfo[apt.doctor_id]?.is_in_chamber ? 'Active' : 'Away'}
                        </span>
                      ) : '—'}
                    </td>
                    <td><StatusBadge status={apt.status} /></td>
                    <td>
                      {apt.status === 'waiting' || apt.status === 'currently_examining'
                        ? apt.waitInfo?.estimatedText || '—'
                        : '—'}
                    </td>
                    <td>
                      {apt.status === 'waiting' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => cancelAppointment(apt.id)}
                        >
                          <FiXCircle /> Cancel
                        </button>
                      )}
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

export default PatientDashboard;
