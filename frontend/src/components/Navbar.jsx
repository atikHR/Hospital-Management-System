import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiActivity, FiMenu, FiX } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'nav-active' : '';

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'doctor': return '/doctor/dashboard';
      case 'patient': return '/patient/dashboard';
      default: return '/';
    }
  };

  const close = () => setMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand" onClick={close}>
          <FiActivity size={28} />
          MediCare HMS
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/doctors" className={isActive('/doctors')}>Doctors</Link>

          {user ? (
            <>
              <Link to={getDashboardLink()} className={isActive(getDashboardLink())}>
                Dashboard
              </Link>
              {user.role === 'patient' && (
                <Link to="/patient/profile" className={isActive('/patient/profile')}>My Profile</Link>
              )}
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className={isActive('/login')}>Login</Link>
              <Link to="/register">
                <button className="btn btn-primary btn-sm">Register</button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* Mobile overlay menu */}
      <div className={`mobile-nav-overlay ${menuOpen ? 'open' : ''}`} onClick={close}>
        <Link to="/" onClick={close}>Home</Link>
        <Link to="/doctors" onClick={close}>Doctors</Link>

        {user ? (
          <>
            <Link to={getDashboardLink()} onClick={close}>Dashboard</Link>
            {user.role === 'patient' && (
              <Link to="/patient/profile" onClick={close}>My Profile</Link>
            )}
            <button onClick={() => { logout(); close(); }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={close}>Login</Link>
            <Link to="/register" onClick={close}>Register</Link>
          </>
        )}
      </div>
    </>
  );
};

export default Navbar;
