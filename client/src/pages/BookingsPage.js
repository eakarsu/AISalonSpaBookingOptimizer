import React, { useState, useEffect } from 'react';
import { getBookings, getClients, getStylists, getServices, createBooking, updateBooking, deleteBooking, submitBookingReview } from '../services/api';

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [conflictError, setConflictError] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: '', comment: '' });
  const [reviewMsg, setReviewMsg] = useState('');
  const [form, setForm] = useState({ client_id: '', stylist_id: '', service_id: '', booking_date: '', start_time: '', end_time: '', status: 'confirmed', notes: '', total_price: '' });

  useEffect(() => {
    loadData();
    Promise.all([getClients(), getStylists(), getServices()]).then(([c, s, sv]) => {
      setClients(c.data);
      setStylists(s.data);
      setServices(sv.data);
    });
  }, []);

  const loadData = async () => {
    const res = await getBookings();
    // Handle paginated response { data: [...], pagination: {...} }
    setBookings(Array.isArray(res.data) ? res.data : (res.data?.data || []));
  };

  const resetForm = () => {
    setForm({ client_id: '', stylist_id: '', service_id: '', booking_date: '', start_time: '', end_time: '', status: 'confirmed', notes: '', total_price: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflictError('');
    try {
      if (editing) {
        await updateBooking(editing.id, form);
      } else {
        await createBooking(form);
      }
      resetForm();
      loadData();
      setSelected(null);
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictError(err.response.data.message || 'Booking conflict detected');
      } else {
        setConflictError(err.response?.data?.error || 'Failed to save booking');
      }
    }
  };

  const handleEdit = (item) => {
    setForm({
      client_id: item.client_id || '', stylist_id: item.stylist_id || '', service_id: item.service_id || '',
      booking_date: item.booking_date ? item.booking_date.split('T')[0] : '', start_time: item.start_time || '',
      end_time: item.end_time || '', status: item.status || 'confirmed', notes: item.notes || '', total_price: item.total_price || ''
    });
    setEditing(item);
    setShowForm(true);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this booking?')) {
      await deleteBooking(id);
      loadData();
      setSelected(null);
    }
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Booking Details</h1>
          <button className="btn btn-secondary" onClick={() => setSelected(null)}>Back to List</button>
        </div>
        <div className="detail-view">
          <div className="detail-header">
            <h2>Booking #{selected.id}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Client</label><span>{selected.client_name || 'N/A'}</span></div>
            <div className="detail-field"><label>Stylist</label><span>{selected.stylist_name || 'N/A'}</span></div>
            <div className="detail-field"><label>Service</label><span>{selected.service_name || 'N/A'}</span></div>
            <div className="detail-field"><label>Date</label><span>{selected.booking_date ? new Date(selected.booking_date).toLocaleDateString() : 'N/A'}</span></div>
            <div className="detail-field"><label>Time</label><span>{selected.start_time} - {selected.end_time}</span></div>
            <div className="detail-field"><label>Status</label><span className={`badge badge-${selected.status}`}>{selected.status}</span></div>
            <div className="detail-field"><label>Total Price</label><span>${selected.total_price}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Notes</label><span>{selected.notes || 'N/A'}</span></div>
            {selected.review_rating && (
              <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                <label>Review</label>
                <span>{'★'.repeat(Math.round(selected.review_rating))} ({selected.review_rating}/5) — {selected.review_comment || ''}</span>
              </div>
            )}
          </div>

          {/* Client Review Form */}
          {!selected.review_rating && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>Submit Review</h3>
              {reviewMsg && <div style={{ color: '#10b981', marginBottom: '8px', fontSize: '13px' }}>{reviewMsg}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label>Rating (1-5)</label>
                  <input type="number" min="1" max="5" value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })} placeholder="1-5 stars" />
                </div>
                <div className="form-group">
                  <label>Comment (optional)</label>
                  <input type="text" value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Leave a comment..." />
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={async () => {
                try {
                  await submitBookingReview(selected.id, { rating: parseInt(reviewForm.rating), comment: reviewForm.comment });
                  setReviewMsg('Review submitted! Stylist rating updated.');
                  loadData();
                } catch (err) {
                  setReviewMsg(err.response?.data?.error || 'Failed to submit review');
                }
              }}>Submit Review</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Bookings</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Booking</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Booking' : 'New Booking'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Client *</label>
                  <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required>
                    <option value="">Select client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stylist *</label>
                  <select value={form.stylist_id} onChange={e => setForm({...form, stylist_id: e.target.value})} required>
                    <option value="">Select stylist...</option>
                    {stylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Service *</label>
                <select value={form.service_id} onChange={e => setForm({...form, service_id: e.target.value})} required>
                  <option value="">Select service...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" value={form.booking_date} onChange={e => setForm({...form, booking_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No Show</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Total Price ($)</label>
                <input type="number" step="0.01" value={form.total_price} onChange={e => setForm({...form, total_price: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              {conflictError && (
                <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
                  ⚠️ {conflictError}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Stylist</th>
              <th>Service</th>
              <th>Time</th>
              <th>Status</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} onClick={() => setSelected(b)}>
                <td>{b.booking_date ? new Date(b.booking_date).toLocaleDateString() : '-'}</td>
                <td><strong>{b.client_name || '-'}</strong></td>
                <td>{b.stylist_name || '-'}</td>
                <td>{b.service_name || '-'}</td>
                <td>{b.start_time?.slice(0,5)}{b.end_time ? ` - ${b.end_time.slice(0,5)}` : ''}</td>
                <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                <td>${b.total_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && <div className="empty-state"><h3>No bookings found</h3></div>}
      </div>
    </div>
  );
}

export default BookingsPage;
