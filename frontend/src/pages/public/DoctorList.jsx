import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const catId = searchParams.get('category');
    if (catId) setSelectedCategory(catId);
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [selectedCategory, search]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory) params.category_id = selectedCategory;
      if (search) params.search = search;
      const res = await api.get('/doctors', { params });
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="page-header">
        <h2>Find a Doctor</h2>
        <p>Browse our specialists and book your appointment</p>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name or specialty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <h3>No doctors found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="cards-grid">
          {doctors.map(doc => (
            <Link to={`/doctors/${doc.id}`} key={doc.id}>
              <div className="card doctor-card">
                <div className="doctor-card-photo">
                  {doc.name?.charAt(0) || '👨‍⚕️'}
                </div>
                <h3>{doc.name}</h3>
                <div className="specialty">{doc.specialty}</div>
                <div className="meta">📋 {doc.qualification}</div>
                <div className="meta">⏱️ {doc.experience_years} years experience</div>
                <div className="meta">🕐 {doc.start_time?.slice(0, 5)} - {doc.end_time?.slice(0, 5)}</div>
                <div className="meta">📅 {doc.available_days}</div>
                <div className="card-footer">
                  <span className="category-count">{doc.category_name}</span>
                  <button className="btn btn-primary btn-sm">Book Now</button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorList;
