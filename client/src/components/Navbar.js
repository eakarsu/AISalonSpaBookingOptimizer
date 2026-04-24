import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Salon & Spa AI</Link>
      <div className="navbar-links">
        <Link to="/" className={isActive('/')}>Dashboard</Link>
        <Link to="/bookings" className={isActive('/bookings')}>Bookings</Link>
        <Link to="/calendar" className={isActive('/calendar')}>Calendar</Link>
        <Link to="/clients" className={isActive('/clients')}>Clients</Link>
        <Link to="/stylists" className={isActive('/stylists')}>Stylists</Link>
        <Link to="/services" className={isActive('/services')}>Services</Link>
        <Link to="/ai" className={isActive('/ai')}>AI</Link>
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowMore(!showMore)}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            More
          </button>
          {showMore && (
            <div
              style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '4px', minWidth: '180px', zIndex: 200,
                boxShadow: 'var(--shadow-lg)'
              }}
              onMouseLeave={() => setShowMore(false)}
            >
              {[
                { path: '/products', label: 'Products' },
                { path: '/waitlist', label: 'Waitlist' },
                { path: '/schedules', label: 'Schedules' },
                { path: '/reviews', label: 'Reviews' },
                { path: '/promotions', label: 'Promotions' },
                { path: '/inventory', label: 'Inventory' },
                { path: '/loyalty', label: 'Loyalty' },
                { path: '/giftcards', label: 'Gift Cards' },
                { path: '/expenses', label: 'Expenses' },
                { path: '/communications', label: 'Communications' },
                { path: '/performance', label: 'Performance' },
                { path: '/reports', label: 'Reports' },
                { path: '/tips', label: 'Tips' },
                { path: '/checkin', label: 'Check-in' },
                { path: '/memberships', label: 'Memberships' },
                { path: '/suppliers', label: 'Suppliers' },
                { path: '/payroll', label: 'Payroll' },
              ].map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMore(false)}
                  style={{
                    display: 'block', padding: '8px 14px', color: location.pathname === item.path ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textDecoration: 'none', fontSize: '0.85rem', borderRadius: '6px',
                    background: location.pathname === item.path ? 'var(--bg-card-hover)' : 'transparent'
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="navbar-user">
        <span>{user?.name}</span>
        <button className="btn-logout" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
