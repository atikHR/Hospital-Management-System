import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiCalendar, FiClock, FiActivity, FiShield, FiHeart, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../api/axios';
import ScrollReveal from '../../components/ScrollReveal';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [offers, setOffers] = useState([]);
  const [stats, setStats] = useState({ doctors: 0, patients: 0, categories: 0 });
  const [heroImages, setHeroImages] = useState([]);
  const [facilityImages, setFacilityImages] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [currentFacilityIndex, setCurrentFacilityIndex] = useState(0);
  const [heroTransitioning, setHeroTransitioning] = useState(false);
  const [facilityTransitioning, setFacilityTransitioning] = useState(false);
  const [healthQuotes, setHealthQuotes] = useState([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  useEffect(() => {
    fetchCategories();
    fetchDoctors();
    fetchOffers();
    fetchHeroImages();
    fetchFacilityImages();
    fetchQuotes();
  }, []);

  // Hero slideshow auto-rotation
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => {
      changeHeroSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages]);

  // Facility slideshow auto-rotation
  useEffect(() => {
    if (facilityImages.length <= 1) return;
    const timer = setInterval(() => {
      changeFacilitySlide((prev) => (prev + 1) % facilityImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [facilityImages]);

  const changeHeroSlide = useCallback((indexOrFn) => {
    setHeroTransitioning(true);
    setTimeout(() => {
      setCurrentHeroIndex(indexOrFn);
      setTimeout(() => setHeroTransitioning(false), 50);
    }, 500);
  }, []);

  const changeFacilitySlide = useCallback((indexOrFn) => {
    setFacilityTransitioning(true);
    setTimeout(() => {
      setCurrentFacilityIndex(indexOrFn);
      setTimeout(() => setFacilityTransitioning(false), 50);
    }, 500);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
      setStats(prev => ({ ...prev, categories: res.data.length }));
    } catch (err) { console.error(err); }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setFeaturedDoctors(res.data.slice(0, 6));
      setStats(prev => ({ ...prev, doctors: res.data.length }));
    } catch (err) { console.error(err); }
  };

  const fetchOffers = async () => {
    try {
      const res = await api.get('/offers');
      setOffers(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchHeroImages = async () => {
    try {
      const res = await api.get('/hospital-images');
      setHeroImages(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchFacilityImages = async () => {
    try {
      const res = await api.get('/facility-images');
      setFacilityImages(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchQuotes = async () => {
    try {
      const res = await api.get('/quotes');
      setHealthQuotes(res.data);
    } catch (err) { console.error(err); }
  };

  // Auto-rotate quotes
  useEffect(() => {
    if (healthQuotes.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentQuoteIndex(prev => (prev + 1) % healthQuotes.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [healthQuotes]);

  const heroNavPrev = () => {
    changeHeroSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };
  const heroNavNext = () => {
    changeHeroSlide((prev) => (prev + 1) % heroImages.length);
  };
  const facilityNavPrev = () => {
    changeFacilitySlide((prev) => (prev - 1 + facilityImages.length) % facilityImages.length);
  };
  const facilityNavNext = () => {
    changeFacilitySlide((prev) => (prev + 1) % facilityImages.length);
  };

  const currentHero = heroImages[currentHeroIndex];
  const currentFacility = facilityImages[currentFacilityIndex];

  return (
    <div>
      {/* Offers Marquee Banner */}
      {offers.length > 0 && (
        <div className="offers-banner">
          <div className="offers-track">
            {[...offers, ...offers, ...offers].map((offer, i) => (
              <div className="offer-item" key={i}>
                <span className="offer-badge" style={{ background: offer.color }}>
                  {offer.badge}
                </span>
                <strong>{offer.title}</strong>
                <span>{offer.description}</span>
                <span className="offer-divider">✦</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero Section with Slideshow Background */}
      <section className="hero hero-slideshow">
        {/* Slideshow Background */}
        {heroImages.length > 0 && (
          <div className="hero-slideshow-bg">
            <div className={`hero-slide-image ${heroTransitioning ? 'fading' : 'visible'}`}
              style={{ backgroundImage: `url(${currentHero?.image_url})` }}
            />
            <div className="hero-slide-overlay" />
          </div>
        )}

        {/* Fallback particles when no images */}
        {heroImages.length === 0 && (
          <>
            <div className="hero-particles">
              <div className="hero-particle"></div>
              <div className="hero-particle"></div>
              <div className="hero-particle"></div>
              <div className="hero-particle"></div>
            </div>
            <div className="hero-grid"></div>
          </>
        )}

        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            Trusted by thousands of patients
          </div>
          <h1>
            Your Health, Our <span>Priority</span>
          </h1>
          <p>
            Book appointments with top specialists, track your queue in real-time,
            and experience seamless healthcare right from your fingertips.
          </p>

          {/* Show slide title */}
          {currentHero?.title && (
            <div className="hero-slide-caption">
              {currentHero.title}
            </div>
          )}

          <div className="hero-buttons">
            <Link to="/doctors">
              <button className="btn btn-primary">
                <FiSearch /> Find a Doctor
              </button>
            </Link>
            <Link to="/register">
              <button className="btn btn-secondary">
                Get Started →
              </button>
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <h3>{stats.doctors}+</h3>
              <p>Expert Doctors</p>
            </div>
            <div className="hero-stat">
              <h3>{stats.categories}</h3>
              <p>Specialties</p>
            </div>
            <div className="hero-stat">
              <h3>24/7</h3>
              <p>Online Booking</p>
            </div>
            <div className="hero-stat">
              <h3>98%</h3>
              <p>Patient Satisfaction</p>
            </div>
          </div>
        </div>

        {/* Hero Navigation */}
        {heroImages.length > 1 && (
          <div className="slideshow-nav hero-slideshow-nav">
            <button className="slide-nav-btn" onClick={heroNavPrev}><FiChevronLeft /></button>
            <div className="slide-dots">
              {heroImages.map((_, i) => (
                <button
                  key={i}
                  className={`slide-dot ${i === currentHeroIndex ? 'active' : ''}`}
                  onClick={() => changeHeroSlide(i)}
                />
              ))}
            </div>
            <button className="slide-nav-btn" onClick={heroNavNext}><FiChevronRight /></button>
          </div>
        )}
      </section>

      {/* ========== HEALTH QUOTES SECTION ========== */}
      {healthQuotes.length > 0 && (
        <section className="quotes-section">
          <div className="quotes-container">
            <div className="quotes-label">
              <span className="quotes-icon">✦</span>
              Words of Wisdom
              <span className="quotes-icon">✦</span>
            </div>
            <div className="quote-display">
              <div className="quote-marks">&ldquo;</div>
              <p className="quote-text" key={currentQuoteIndex}>
                {healthQuotes[currentQuoteIndex]?.quote_text}
              </p>
              <div className="quote-author">
                <span className={`quote-category-tag ${healthQuotes[currentQuoteIndex]?.category}`}>
                  {healthQuotes[currentQuoteIndex]?.category === 'hadith' ? '🕌 Hadith'
                    : healthQuotes[currentQuoteIndex]?.category === 'scholar' ? '📖 Scholar'
                    : '💚 Wisdom'}
                </span>
                <span className="quote-author-name">— {healthQuotes[currentQuoteIndex]?.author}</span>
                {healthQuotes[currentQuoteIndex]?.source && (
                  <span className="quote-source">({healthQuotes[currentQuoteIndex]?.source})</span>
                )}
              </div>
            </div>
            {healthQuotes.length > 1 && (
              <div className="quote-dots">
                {healthQuotes.map((_, i) => (
                  <button
                    key={i}
                    className={`quote-dot ${i === currentQuoteIndex ? 'active' : ''}`}
                    onClick={() => setCurrentQuoteIndex(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="section">
        <ScrollReveal>
          <h2 className="section-title">How It <span>Works</span></h2>
          <p className="section-subtitle">Book your appointment in 3 simple steps</p>
          <div className="section-divider"></div>
        </ScrollReveal>

        <div className="steps-grid">
          {['Find Your Doctor', 'Book Appointment', 'Track Your Queue'].map((title, i) => (
            <ScrollReveal key={i} delay={i * 150}>
              <div className="card step-card">
                <div className="step-number">{i + 1}</div>
                <h3>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {i === 0 && 'Browse through 10+ categories and find specialists that match your needs.'}
                  {i === 1 && 'Select your preferred date and get an automatic serial number instantly.'}
                  {i === 2 && 'Monitor your position and estimated wait time with real-time updates.'}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ========== FACILITIES SECTION ========== */}
      {facilityImages.length > 0 && (
        <section className="section facilities-section">
          <ScrollReveal>
            <h2 className="section-title">Our <span>Facilities</span></h2>
            <p className="section-subtitle">World-class infrastructure for comprehensive healthcare</p>
            <div className="section-divider"></div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="facility-showcase">
              {/* Main Image */}
              <div className="facility-main-image">
                <div className={`facility-slide-image ${facilityTransitioning ? 'fading' : 'visible'}`}
                  style={{ backgroundImage: `url(${currentFacility?.image_url})` }}
                />
                <div className="facility-image-overlay">
                  <div className="facility-image-caption">
                    <h3>{currentFacility?.title}</h3>
                    {currentFacility?.description && (
                      <p>{currentFacility.description}</p>
                    )}
                  </div>
                </div>

                {/* Navigation arrows */}
                {facilityImages.length > 1 && (
                  <>
                    <button className="facility-nav-btn prev" onClick={facilityNavPrev}>
                      <FiChevronLeft />
                    </button>
                    <button className="facility-nav-btn next" onClick={facilityNavNext}>
                      <FiChevronRight />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              <div className="facility-thumbnails">
                {facilityImages.map((img, i) => (
                  <button
                    key={img.id}
                    className={`facility-thumb ${i === currentFacilityIndex ? 'active' : ''}`}
                    onClick={() => changeFacilitySlide(i)}
                  >
                    <img src={img.image_url} alt={img.title} />
                    <span>{img.title}</span>
                  </button>
                ))}
              </div>

              {/* Dots for mobile */}
              <div className="facility-dots">
                {facilityImages.map((_, i) => (
                  <button
                    key={i}
                    className={`slide-dot ${i === currentFacilityIndex ? 'active' : ''}`}
                    onClick={() => changeFacilitySlide(i)}
                  />
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section" style={{ background: 'rgba(13, 20, 37, 0.5)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <ScrollReveal>
              <h2 className="section-title">Medical <span>Specialties</span></h2>
              <p className="section-subtitle">Find doctors by their field of expertise</p>
              <div className="section-divider"></div>
            </ScrollReveal>

            <div className="cards-grid">
              {categories.map((cat, i) => (
                <ScrollReveal key={cat.id} delay={i * 80}>
                  <Link to={`/doctors?category=${cat.id}`}>
                    <div className="card category-card">
                      <div className="category-icon">{cat.icon}</div>
                      <h3>{cat.name}</h3>
                      <p>{cat.description}</p>
                      <div className="category-count">
                        {cat.doctor_count} {parseInt(cat.doctor_count) === 1 ? 'Doctor' : 'Doctors'}
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Doctors */}
      {featuredDoctors.length > 0 && (
        <section className="section">
          <ScrollReveal>
            <h2 className="section-title">Our Top <span>Specialists</span></h2>
            <p className="section-subtitle">Experienced doctors ready to help you</p>
            <div className="section-divider"></div>
          </ScrollReveal>

          <div className="cards-grid">
            {featuredDoctors.map((doc, i) => (
              <ScrollReveal key={doc.id} delay={i * 100}>
                <Link to={`/doctors/${doc.id}`}>
                  <div className="card doctor-card">
                    <div className="doctor-card-photo">
                      {doc.name?.charAt(0) || '👨‍⚕️'}
                    </div>
                    <h3>{doc.name}</h3>
                    <div className="specialty">{doc.specialty}</div>
                    <div className="meta">📋 {doc.qualification}</div>
                    <div className="meta">⏱️ {doc.experience_years} years experience</div>
                    <div className="card-footer">
                      <span className="category-count">{doc.category_name}</span>
                      <button className="btn btn-primary btn-sm">View Profile</button>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="section" style={{ background: 'rgba(13, 20, 37, 0.5)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal>
            <h2 className="section-title">Why Choose <span>MediCare</span></h2>
            <p className="section-subtitle">Modern healthcare management at your fingertips</p>
            <div className="section-divider"></div>
          </ScrollReveal>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {[
              { icon: <FiCalendar size={26} />, color: 'green', title: 'Easy Booking', desc: 'Book appointments online 24/7' },
              { icon: <FiClock size={26} />, color: 'blue', title: 'Live Queue', desc: 'Real-time queue position tracking' },
              { icon: <FiShield size={26} />, color: 'yellow', title: 'Trusted Care', desc: 'Verified expert specialists' },
              { icon: <FiActivity size={26} />, color: 'purple', title: 'Smart Updates', desc: 'Instant status notifications' },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 120}>
                <div className="stat-card" style={{ flexDirection: 'column', textAlign: 'center', padding: '2rem', opacity: 1 }}>
                  <div className={`stat-icon ${item.color}`} style={{ margin: '0 auto 1rem', width: '60px', height: '60px' }}>
                    {item.icon}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section">
        <ScrollReveal>
          <h2 className="section-title">Patient <span>Stories</span></h2>
          <p className="section-subtitle">What our patients say about us</p>
          <div className="section-divider"></div>
        </ScrollReveal>

        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {[
            { text: '"The queue tracking feature saved me hours of waiting. I could see exactly when the doctor would see me!"', name: 'Rahim Uddin', role: 'Regular Patient' },
            { text: '"Booking an appointment is so easy. Just a few clicks and I have my serial number ready. Highly recommend!"', name: 'Jasmine Akter', role: 'First-time Patient' },
            { text: '"As a doctor, managing my patient queue has never been easier. The real-time status updates keep everything organized."', name: 'Dr. Sarah Ahmed', role: 'Cardiologist' },
          ].map((t, i) => (
            <ScrollReveal key={i} delay={i * 150}>
              <div className="testimonial-card">
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.name.charAt(0)}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <ScrollReveal direction="scale">
        <section style={{ padding: '5rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(22,199,154,0.08) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 className="section-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
              Ready to Experience <span>Better Healthcare</span>?
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem' }}>
              Join thousands of patients who trust MediCare HMS for their healthcare needs.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/register">
                <button className="btn btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: '1rem' }}>
                  <FiHeart /> Get Started Free
                </button>
              </Link>
              <Link to="/doctors">
                <button className="btn btn-secondary" style={{ padding: '0.9rem 2.5rem', fontSize: '1rem' }}>
                  Browse Doctors
                </button>
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-col">
            <h4 style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MediCare HMS
            </h4>
            <p>Your trusted hospital management platform. Quality healthcare at your fingertips.</p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link to="/doctors">Find Doctors</Link>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
          </div>
          <div className="footer-col">
            <h4>Specialties</h4>
            <a>Cardiology</a>
            <a>Neurology</a>
            <a>Orthopedics</a>
            <a>Pediatrics</a>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <p>📍 Dhaka, Bangladesh</p>
            <p>📞 +880 1700-000000</p>
            <p>✉️ info@medicare-hms.com</p>
          </div>
        </div>
        <p style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          © 2026 MediCare HMS. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Home;
