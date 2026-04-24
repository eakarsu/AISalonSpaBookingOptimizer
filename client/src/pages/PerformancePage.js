import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

function PerformancePage() {
  const [performers, setPerformers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const r = await api.get('/performance'); setPerformers(r.data); } catch(e) { console.error(e); } };

  const viewDetail = async (p) => {
    setSelected(p);
    try { const r = await api.get(`/performance/${p.id}`); setDetail(r.data); } catch(e) { console.error(e); }
  };

  const renderStars = (rating) => { const s = Math.round(rating || 0); return '★'.repeat(s) + '☆'.repeat(5 - s); };

  if (selected && detail) {
    return (
      <div>
        <div className="page-header"><h1>Performance: {selected.name}</h1><button className="btn btn-secondary" onClick={() => { setSelected(null); setDetail(null); }}>Back to List</button></div>
        <div className="detail-view">
          <div className="detail-header"><h2>{selected.name}</h2></div>
          <div className="detail-grid">
            <div className="detail-field"><label>Specialties</label><span>{selected.specialties}</span></div>
            <div className="detail-field"><label>Experience</label><span>{selected.experience_years} years</span></div>
            <div className="detail-field"><label>Total Bookings</label><span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--primary-light)' }}>{selected.total_bookings}</span></div>
            <div className="detail-field"><label>Total Revenue</label><span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--success)' }}>${Number(selected.total_revenue).toFixed(2)}</span></div>
            <div className="detail-field"><label>Clients Served</label><span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--info)' }}>{selected.clients_served}</span></div>
            <div className="detail-field"><label>Avg Review Rating</label><span className="star-rating">{renderStars(selected.avg_review_rating)} ({Number(selected.avg_review_rating).toFixed(1)})</span></div>
          </div>
        </div>

        {detail.revenue_by_service && detail.revenue_by_service.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '12px', fontFamily: "'Playfair Display', serif" }}>Revenue by Service</h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead><tr><th>Service</th><th>Category</th><th>Bookings</th><th>Revenue</th></tr></thead>
                <tbody>
                  {detail.revenue_by_service.map((s, i) => (
                    <tr key={i}><td><strong>{s.name}</strong></td><td>{s.category}</td><td>{s.booking_count}</td><td>${Number(s.revenue).toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {detail.recent_bookings && detail.recent_bookings.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '12px', fontFamily: "'Playfair Display', serif" }}>Recent Bookings</h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Client</th><th>Service</th><th>Status</th><th>Price</th></tr></thead>
                <tbody>
                  {detail.recent_bookings.map(b => (
                    <tr key={b.id}><td>{b.booking_date ? new Date(b.booking_date).toLocaleDateString() : '-'}</td><td>{b.client_name}</td><td>{b.service_name}</td><td><span className={`badge badge-${b.status}`}>{b.status}</span></td><td>${b.total_price}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h1>Staff Performance</h1></div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Stylist</th><th>Specialties</th><th>Bookings</th><th>Revenue</th><th>Rating</th><th>Clients</th></tr></thead>
          <tbody>
            {performers.map(p => (
              <tr key={p.id} onClick={() => viewDetail(p)}>
                <td><strong>{p.name}</strong></td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.specialties}</td>
                <td>{p.total_bookings}</td>
                <td>${Number(p.total_revenue).toFixed(2)}</td>
                <td><span className="star-rating">{renderStars(p.rating)}</span></td>
                <td>{p.clients_served}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {performers.length === 0 && <div className="empty-state"><h3>No performance data yet</h3></div>}
      </div>
    </div>
  );
}

export default PerformancePage;
