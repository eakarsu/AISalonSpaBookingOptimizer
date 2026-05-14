import React, { useState, useEffect } from 'react';
import { getBookingsByDate, getStylists, createBooking } from '../services/api';

function BookingCalendarPage() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [bookings, setBookings] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ stylist_id: '', start_time: '', end_time: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getStylists().then(r => setStylists(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      getBookingsByDate(selectedDate)
        .then(r => setBookings(r.data?.bookings || []))
        .catch(() => setBookings([]))
        .finally(() => setLoading(false));
    }
  }, [selectedDate]);

  const HOURS = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

  const getBookingsForStylist = (stylistId) =>
    bookings.filter(b => b.stylist_id === stylistId);

  const handleQuickBook = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createBooking({ ...formData, booking_date: selectedDate, status: 'confirmed' });
      setSuccess('Booking created successfully!');
      setShowForm(false);
      setFormData({ stylist_id: '', start_time: '', end_time: '' });
      const r = await getBookingsByDate(selectedDate);
      setBookings(r.data?.bookings || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create booking';
      setError(msg);
    }
  };

  const statusColor = (s) => ({ confirmed: '#10b981', pending: '#f59e0b', cancelled: '#ef4444', completed: '#6b7280' }[s] || '#3b82f6');

  return (
    <div>
      <div className="page-header">
        <h1>Booking Calendar</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          + Quick Book
        </button>
      </div>

      {success && <div style={{ background: '#d1fae5', border: '1px solid #10b981', color: '#065f46', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>{success}</div>}
      {error && <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      {showForm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Quick Booking</h3>
          <form onSubmit={handleQuickBook}>
            <div className="form-row">
              <div className="form-group">
                <label>Stylist *</label>
                <select value={formData.stylist_id} onChange={e => setFormData({ ...formData, stylist_id: e.target.value })} required>
                  <option value="">Select stylist...</option>
                  {stylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Start Time *</label>
                <input type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>End Time *</label>
                <input type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary">Book</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <label style={{ fontWeight: '600' }}>Date:</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {bookings.length} bookings
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading schedule...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '800px' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${stylists.length}, 1fr)`, gap: '4px', marginBottom: '4px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px 0' }}>Time</div>
              {stylists.map(s => (
                <div key={s.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{s.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>★ {s.rating || 'N/A'}</div>
                </div>
              ))}
            </div>

            {/* Hour rows */}
            {HOURS.map(hour => (
              <div key={hour} style={{ display: 'grid', gridTemplateColumns: `80px repeat(${stylists.length}, 1fr)`, gap: '4px', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '12px 4px', textAlign: 'right' }}>{hour}</div>
                {stylists.map(s => {
                  const stylistBookings = getBookingsForStylist(s.id).filter(b => {
                    const bHour = b.start_time ? b.start_time.substring(0, 5) : '';
                    return bHour === hour;
                  });
                  return (
                    <div key={s.id} style={{ minHeight: '48px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px', position: 'relative' }}>
                      {stylistBookings.map(b => (
                        <div key={b.id} style={{
                          background: statusColor(b.status), color: '#fff',
                          borderRadius: '4px', padding: '3px 6px', fontSize: '11px', marginBottom: '2px'
                        }}>
                          <div style={{ fontWeight: '600' }}>{b.client_name || 'Client'}</div>
                          <div>{b.service_name || 'Service'}</div>
                          <div>{b.start_time} - {b.end_time}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        {[['confirmed', '#10b981'], ['pending', '#f59e0b'], ['cancelled', '#ef4444'], ['completed', '#6b7280']].map(([s, c]) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: c }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookingCalendarPage;
