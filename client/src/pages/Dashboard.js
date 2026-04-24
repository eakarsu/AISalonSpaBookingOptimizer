import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

function Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const endpoints = ['stylists','services','clients','bookings','products','waitlist','schedules','reviews','promotions','inventory','loyalty','giftcards','expenses','communications','tips','checkin','memberships','suppliers','payroll'];
    Promise.all(endpoints.map(e => api.get(`/${e}`).then(r => [e, r.data.length]).catch(() => [e, 0])))
      .then(results => {
        const c = {};
        results.forEach(([key, count]) => { c[key] = count; });
        setCounts(c);
      });
  }, []);

  const cards = [
    // Core Management
    { title: 'Bookings', desc: 'Manage appointments and scheduling', count: counts.bookings, path: '/bookings', color: '#10B981', icon: '\u{1F4C5}' },
    { title: 'Calendar View', desc: 'Visual weekly appointment calendar', count: null, path: '/calendar', color: '#6366F1', icon: '\u{1F5D3}' },
    { title: 'Clients', desc: 'Client profiles, preferences & history', count: counts.clients, path: '/clients', color: '#06B6D4', icon: '\u{1F465}' },
    { title: 'Stylists', desc: 'Manage your team of specialists', count: counts.stylists, path: '/stylists', color: '#8B5CF6', icon: '\u{1F487}' },
    { title: 'Services', desc: 'Hair, spa, skincare & nail services', count: counts.services, path: '/services', color: '#EC4899', icon: '\u2702\uFE0F' },
    { title: 'Schedules', desc: 'Staff schedule & availability management', count: counts.schedules, path: '/schedules', color: '#14B8A6', icon: '\u{1F552}' },
    // Products & Inventory
    { title: 'Products', desc: 'Retail products catalog', count: counts.products, path: '/products', color: '#F59E0B', icon: '\u{1F9F4}' },
    { title: 'Inventory', desc: 'Track stock, restocks & transactions', count: counts.inventory, path: '/inventory', color: '#D97706', icon: '\u{1F4E6}' },
    // Client Management
    { title: 'Waitlist', desc: 'Manage waiting clients & priorities', count: counts.waitlist, path: '/waitlist', color: '#EF4444', icon: '\u23F3' },
    { title: 'Reviews & Ratings', desc: 'Client feedback and star ratings', count: counts.reviews, path: '/reviews', color: '#F97316', icon: '\u2B50' },
    { title: 'Loyalty Program', desc: 'Points, rewards & client retention', count: counts.loyalty, path: '/loyalty', color: '#A855F7', icon: '\u{1F3C6}' },
    { title: 'Communications', desc: 'Client messages, emails & notifications', count: counts.communications, path: '/communications', color: '#0EA5E9', icon: '\u{1F4E8}' },
    // Business Operations
    { title: 'Promotions', desc: 'Discounts, promo codes & campaigns', count: counts.promotions, path: '/promotions', color: '#E11D48', icon: '\u{1F3F7}\uFE0F' },
    { title: 'Gift Cards', desc: 'Issue and track gift card balances', count: counts.giftcards, path: '/giftcards', color: '#DB2777', icon: '\u{1F381}' },
    { title: 'Expenses', desc: 'Track salon expenses & overhead', count: counts.expenses, path: '/expenses', color: '#DC2626', icon: '\u{1F4B0}' },
    // Staff & Operations
    { title: 'Tips Tracking', desc: 'Record and track stylist tips', count: counts.tips, path: '/tips', color: '#22C55E', icon: '\u{1F4B5}' },
    { title: 'Client Check-in', desc: 'Arrival, service & completion flow', count: counts.checkin, path: '/checkin', color: '#0EA5E9', icon: '\u{1F6CE}\uFE0F' },
    { title: 'Memberships', desc: 'Monthly & annual subscription plans', count: counts.memberships, path: '/memberships', color: '#8B5CF6', icon: '\u{1F4B3}' },
    { title: 'Suppliers', desc: 'Manage product vendors & orders', count: counts.suppliers, path: '/suppliers', color: '#F97316', icon: '\u{1F69A}' },
    { title: 'Payroll', desc: 'Staff pay, commissions & earnings', count: counts.payroll, path: '/payroll', color: '#14B8A6', icon: '\u{1F4B2}' },
    // Analytics & AI
    { title: 'Staff Performance', desc: 'Stylist analytics, revenue & ratings', count: null, path: '/performance', color: '#7C3AED', icon: '\u{1F4C8}' },
    { title: 'Reports & Analytics', desc: 'Revenue, trends & business insights', count: null, path: '/reports', color: '#2563EB', icon: '\u{1F4CA}' },
    // AI Features
    { title: 'AI Stylist Matching', desc: 'Smart stylist recommendations by specialty', count: null, path: '/ai', color: '#7C3AED', icon: '\u{1F916}' },
    { title: 'AI Duration Predictor', desc: 'Predict service duration with AI', count: null, path: '/ai', color: '#2563EB', icon: '\u23F1\uFE0F' },
    { title: 'AI Product Advisor', desc: 'Personalized product recommendations', count: null, path: '/ai', color: '#0891B2', icon: '\u{1F48E}' },
    { title: 'AI Rebooking', desc: 'Automated rebooking suggestions', count: null, path: '/ai', color: '#059669', icon: '\u{1F504}' },
    { title: 'AI Waitlist Optimizer', desc: 'Smart waitlist prioritization', count: null, path: '/ai', color: '#D97706', icon: '\u{1F9E0}' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>27 Features</span>
      </div>
      <div className="dashboard-grid">
        {cards.map((card, i) => (
          <div key={i} className="dash-card" onClick={() => navigate(card.path)}>
            <div className="dash-card-icon" style={{ background: `${card.color}20` }}>
              <span>{card.icon}</span>
            </div>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
            {card.count !== null && card.count !== undefined && <div className="count">{card.count}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
