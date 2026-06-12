import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const DoctorProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingDate, setBookingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  const fetchDoctor = async () => {
    try {
      const res = await api.get(`/doctors/${id}`);
      setDoctor(res.data);
    } catch (err) {
      toast.error('Doctor not found');
      navigate('/doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to book an appointment');
      navigate('/login');
      return;
    }
    if (user.role !== 'patient') {
      toast.error('Only patients can book appointments');
      return;
    }

    setBooking(true);
    try {
      const res = await api.post('/appointments', {
        doctor_id: parseInt(id),
        appointment_date: bookingDate,
        notes,
      });
      toast.success(`Appointment booked! Serial #${res.data.appointment.serial_number}`);
      setBookingDate('');
      setNotes('');
      navigate('/patient/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (!doctor) return null;

  return (
    <div className="doctor-profile">
      <div className="doctor-profile-header">
        <div className="doctor-profile-photo">
          {doctor.name?.charAt(0) || '👨‍⚕️'}
        </div>
        <div className="doctor-profile-info">
          <h1>{doctor.name}</h1>
          <div className="specialty">{doctor.specialty}</div>
          <span className="category-count">{doctor.category_name}</span>
        </div>
      </div>

      {doctor.bio && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.8rem' }}>About</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{doctor.bio}</p>
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-item">
          <label>Qualification</label>
          <span>{doctor.qualification || 'N/A'}</span>
        </div>
        <div className="detail-item">
          <label>Experience</label>
          <span>{doctor.experience_years} years</span>
        </div>
        <div className="detail-item">
          <label>Avg. Consult Time</label>
          <span>{doctor.avg_consult_time} minutes</span>
        </div>
        <div className="detail-item">
          <label>Available Days</label>
          <span>{doctor.available_days}</span>
        </div>
        <div className="detail-item">
          <label>Schedule</label>
          <span>{doctor.start_time?.slice(0, 5)} - {doctor.end_time?.slice(0, 5)}</span>
        </div>
        <div className="detail-item">
          <label>Today's Queue</label>
          <span>{doctor.todayPatients} patients</span>
        </div>
      </div>

      {/* Booking Form */}
      <div className="booking-card">
        <h3>📅 Book an Appointment</h3>
        {!user ? (
          <div className="empty-state" style={{ padding: '1.5rem 0' }}>
            <p>Please <a href="/login" style={{ color: 'var(--accent)' }}>login</a> to book an appointment</p>
          </div>
        ) : user.role !== 'patient' ? (
          <div className="empty-state" style={{ padding: '1.5rem 0' }}>
            <p>Only patients can book appointments</p>
          </div>
        ) : (
          <form onSubmit={handleBooking}>
            <div className="form-group">
              <label>Select Date</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={getTodayDate()}
                required
              />
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your symptoms or reason for visit..."
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={booking}>
              {booking ? 'Booking...' : 'Book Appointment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;
