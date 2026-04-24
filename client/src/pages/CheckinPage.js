import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const STATUS_COLORS = { checked_in: '#F59E0B', in_service: '#3B82F6', completed: '#10B981', no_show: '#EF4444' };
const STATUS_LABELS = { checked_in: 'Checked In', in_service: 'In Service', completed: 'Completed', no_show: 'No Show' };

function CheckinPage() {
  const [checkins, setCheckins] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ booking_id: '' });
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    const [ci, bk] = await Promise.all([api.get('/checkin'), api.get('/bookings')]);
    setCheckins(ci.data); setBookings(bk.data);
  };

  const checkedInBookingIds = new Set(checkins.map(c => c.booking_id));
  const availableBookings = bookings.filter(b => !checkedInBookingIds.has(b.id) && b.status === 'confirmed');

  const handleCheckin = async (e) => {
    e.preventDefault();
    await api.post('/checkin', { booking_id: parseInt(form.booking_id) });
    setForm({ booking_id: '' }); setShowForm(false); loadData();
  };

  const handleAction = async (id, action) => {
    await api.put(`/checkin/${id}/${action}`);
    loadData();
  };

  const filtered = filter === 'all' ? checkins : checkins.filter(c => c.status === filter);

  const counts = { all: checkins.length, checked_in: 0, in_service: 0, completed: 0, no_show: 0 };
  checkins.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  return (
    <div>
      <div className="page-header">
        <h1>Client Check-in</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Check In Client</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {Object.entries({ all: 'All', checked_in: 'Waiting', in_service: 'In Service', completed: 'Done', no_show: 'No Show' }).map(([key, label]) => (
          <div key={key} onClick={() => setFilter(key)} style={{
            background: filter === key ? (STATUS_COLORS[key] || 'var(--accent)')+'20' : 'var(--bg-card)',
            padding: '16px', borderRadius: '12px', border: `1px solid ${filter === key ? (STATUS_COLORS[key] || 'var(--accent)') : 'var(--border)'}`,
            cursor: 'pointer', textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: STATUS_COLORS[key] || 'var(--text-primary)' }}>{counts[key]}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <h2>Check In Client</h2>
            <form onSubmit={handleCheckin}>
              <div className="form-group">
                <label>Select Booking *</label>
                <select value={form.booking_id} onChange={e => setForm({ booking_id: e.target.value })} required>
                  <option value="">Select a confirmed booking...</option>
                  {availableBookings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.client_name} - {b.service_name} with {b.stylist_name} ({b.booking_date ? new Date(b.booking_date).toLocaleDateString() : ''} at {b.start_time})
                    </option>
                  ))}
                </select>
              </div>
              {availableBookings.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No confirmed bookings available for check-in.</p>}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={availableBookings.length === 0}>Check In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '12px' }}>
        {filtered.map(ci => (
          <div key={ci.id} style={{
            background: 'var(--bg-card)', borderRadius: '12px', padding: '20px',
            border: `1px solid var(--border)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <h3 style={{ margin: 0 }}>{ci.client_name || 'Unknown'}</h3>
                <span style={{
                  background: (STATUS_COLORS[ci.status] || '#666') + '20',
                  color: STATUS_COLORS[ci.status] || '#666',
                  padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600
                }}>{STATUS_LABELS[ci.status] || ci.status}</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {ci.service_name} with {ci.stylist_name} | {ci.start_time} - {ci.end_time || '?'}
                {ci.total_price && <span> | ${ci.total_price}</span>}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                {ci.checked_in_at && <span>Arrived: {new Date(ci.checked_in_at).toLocaleTimeString()} </span>}
                {ci.service_started_at && <span>| Started: {new Date(ci.service_started_at).toLocaleTimeString()} </span>}
                {ci.completed_at && <span>| Done: {new Date(ci.completed_at).toLocaleTimeString()}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {ci.status === 'checked_in' && (
                <>
                  <button className="btn btn-primary btn-sm" onClick={() => handleAction(ci.id, 'start-service')}>Start Service</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleAction(ci.id, 'no-show')}>No Show</button>
                </>
              )}
              {ci.status === 'in_service' && (
                <button className="btn btn-primary btn-sm" style={{ background: '#10B981' }} onClick={() => handleAction(ci.id, 'complete')}>Complete</button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state"><h3>No check-ins found</h3><p>Check in clients from their confirmed bookings</p></div>}
      </div>
    </div>
  );
}

export default CheckinPage;
