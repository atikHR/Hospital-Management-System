import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiUser, FiCalendar, FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';

const Register = () => {
  const [step, setStep] = useState(1); // 1 = account info, 2 = book appointment (optional)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);

  // Step 2 — appointment
  const [categories, setCategories] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 2) {
      fetchCategories();
    }
  }, [step]);

  useEffect(() => {
    if (selectedCategory) fetchDoctors(selectedCategory);
    else setDoctors([]);
    setSelectedDoctor('');
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch { /* ignore */ }
  };

  const fetchDoctors = async (catId) => {
    try {
      const res = await api.get('/doctors', { params: { category_id: catId } });
      setDoctors(res.data);
    } catch { /* ignore */ }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => navigate('/patient/dashboard');

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !bookingDate) {
      toast.error('Please select a doctor and date');
      return;
    }
    setBooking(true);
    try {
      const res = await api.post('/appointments', {
        doctor_id: parseInt(selectedDoctor),
        appointment_date: bookingDate,
        notes,
      });
      toast.success(`Appointment booked! Serial #${res.data.appointment.serial_number}`);
      navigate('/patient/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const selectedDoctorData = doctors.find(d => String(d.id) === String(selectedDoctor));

  if (step === 2) {
    return (
      <div className="auth-container">
        <div className="auth-box auth-box-wide">
          <div className="step-indicator">
            <div className="step completed"><FiCheck /> <span>Account Created</span></div>
            <div className="step-line"></div>
            <div className="step active"><FiCalendar /> <span>Book Appointment</span></div>
          </div>

          <h2>Book Your First Appointment</h2>
          <p className="auth-subtitle">Optional — you can always book later from your dashboard</p>

          <form onSubmit={handleBookAppointment}>
            <div className="form-group">
              <label>Select Specialty</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                <option value="">All Specialties</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Doctor *</label>
              <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} required>
                <option value="">— Choose a doctor —</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.specialty || d.category_name}</option>
                ))}
              </select>
            </div>

            {selectedDoctorData && (
              <div className="doctor-mini-card">
                <div className="doctor-mini-avatar">{selectedDoctorData.name?.charAt(0)}</div>
                <div>
                  <strong>{selectedDoctorData.name}</strong>
                  <p>{selectedDoctorData.specialty}</p>
                  <small>Available: {selectedDoctorData.available_days} &bull; {selectedDoctorData.start_time?.slice(0,5)}–{selectedDoctorData.end_time?.slice(0,5)}</small>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Appointment Date *</label>
              <input
                type="date"
                value={bookingDate}
                onChange={e => setBookingDate(e.target.value)}
                min={getTodayDate()}
                required
              />
            </div>

            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe your symptoms or reason for visit..."
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={handleSkip} style={{ flex: 1 }}>
                <FiArrowLeft /> Skip for Now
              </button>
              <button type="submit" className="btn btn-primary" disabled={booking} style={{ flex: 1 }}>
                {booking ? 'Booking...' : <><FiCalendar /> Book Appointment</>}
              </button>
            </div>
          </form>

          <p className="auth-link" style={{ marginTop: '1rem' }}>
            <button className="link-btn" onClick={handleSkip}>Go to Dashboard <FiArrowRight /></button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="step-indicator">
          <div className="step active"><FiUser /> <span>Create Account</span></div>
          <div className="step-line"></div>
          <div className="step"><FiCalendar /> <span>Book Appointment</span></div>
        </div>

        <h2>Create Account</h2>
        <p className="auth-subtitle">Register as a patient</p>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating Account...' : <><FiArrowRight /> Next: Book Appointment</>}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
