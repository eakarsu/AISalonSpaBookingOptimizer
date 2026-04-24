import React, { useState, useEffect } from 'react';
import { getClients, getStylists, getServices } from '../services/api';
import api from '../services/api';

const getReviews = () => api.get('/reviews');
const createReview = (data) => api.post('/reviews', data);
const updateReview = (id, data) => api.put(`/reviews/${id}`, data);
const deleteReview = (id) => api.delete(`/reviews/${id}`);

const renderStars = (rating) => {
  const filled = Math.min(Math.max(Math.round(rating), 0), 5);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
};

function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [clients, setClients] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ client_id: '', stylist_id: '', service_id: '', rating: '', comment: '', visit_date: '', would_recommend: true });

  useEffect(() => {
    loadData();
    Promise.all([getClients(), getStylists(), getServices()]).then(([c, s, sv]) => {
      setClients(c.data);
      setStylists(s.data);
      setServices(sv.data);
    });
  }, []);

  const loadData = async () => {
    const res = await getReviews();
    setReviews(res.data);
  };

  const resetForm = () => {
    setForm({ client_id: '', stylist_id: '', service_id: '', rating: '', comment: '', visit_date: '', would_recommend: true });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateReview(editing.id, form);
    } else {
      await createReview(form);
    }
    resetForm();
    loadData();
    setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({
      client_id: item.client_id || '', stylist_id: item.stylist_id || '', service_id: item.service_id || '',
      rating: item.rating || '', comment: item.comment || '',
      visit_date: item.visit_date ? item.visit_date.split('T')[0] : '', would_recommend: item.would_recommend !== false
    });
    setEditing(item);
    setShowForm(true);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this review?')) {
      await deleteReview(id);
      loadData();
      setSelected(null);
    }
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Review Details</h1>
          <button className="btn btn-secondary" onClick={() => setSelected(null)}>Back to List</button>
        </div>
        <div className="detail-view">
          <div className="detail-header">
            <h2>Review #{selected.id}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Client</label><span>{selected.client_name || 'N/A'}</span></div>
            <div className="detail-field"><label>Stylist</label><span>{selected.stylist_name || 'N/A'}</span></div>
            <div className="detail-field"><label>Service</label><span>{selected.service_name || 'N/A'}</span></div>
            <div className="detail-field"><label>Rating</label><span>{renderStars(selected.rating)} ({selected.rating}/5)</span></div>
            <div className="detail-field"><label>Visit Date</label><span>{selected.visit_date ? new Date(selected.visit_date).toLocaleDateString() : 'N/A'}</span></div>
            <div className="detail-field"><label>Would Recommend</label><span>{selected.would_recommend ? 'Yes' : 'No'}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Comment</label><span>{selected.comment || 'N/A'}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Reviews</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Review</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Review' : 'New Review'}</h2>
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
                  <label>Rating (1-5) *</label>
                  <select value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} required>
                    <option value="">Select rating...</option>
                    <option value="5">★★★★★ (5)</option>
                    <option value="4">★★★★☆ (4)</option>
                    <option value="3">★★★☆☆ (3)</option>
                    <option value="2">★★☆☆☆ (2)</option>
                    <option value="1">★☆☆☆☆ (1)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Visit Date *</label>
                  <input type="date" value={form.visit_date} onChange={e => setForm({...form, visit_date: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>Would Recommend</label>
                <select value={form.would_recommend} onChange={e => setForm({...form, would_recommend: e.target.value === 'true'})}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} />
              </div>
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
              <th>Client</th>
              <th>Stylist</th>
              <th>Service</th>
              <th>Rating</th>
              <th>Date</th>
              <th>Would Recommend</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id} onClick={() => setSelected(r)}>
                <td><strong>{r.client_name || '-'}</strong></td>
                <td>{r.stylist_name || '-'}</td>
                <td>{r.service_name || '-'}</td>
                <td>{renderStars(r.rating)}</td>
                <td>{r.visit_date ? new Date(r.visit_date).toLocaleDateString() : '-'}</td>
                <td>{r.would_recommend ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {reviews.length === 0 && <div className="empty-state"><h3>No reviews found</h3></div>}
      </div>
    </div>
  );
}

export default ReviewsPage;
