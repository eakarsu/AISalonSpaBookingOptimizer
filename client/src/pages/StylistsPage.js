import React, { useState, useEffect } from 'react';
import { getStylists, createStylist, updateStylist, deleteStylist } from '../services/api';

function StylistsPage() {
  const [stylists, setStylists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', specialties: '', experience_years: '', rating: '', bio: '', hourly_rate: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const res = await getStylists();
    setStylists(res.data);
  };

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', specialties: '', experience_years: '', rating: '', bio: '', hourly_rate: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateStylist(editing.id, form);
    } else {
      await createStylist(form);
    }
    resetForm();
    loadData();
    setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name, email: item.email || '', phone: item.phone || '',
      specialties: item.specialties || '', experience_years: item.experience_years || '',
      rating: item.rating || '', bio: item.bio || '', hourly_rate: item.hourly_rate || ''
    });
    setEditing(item);
    setShowForm(true);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stylist?')) {
      await deleteStylist(id);
      loadData();
      setSelected(null);
    }
  };

  const renderStars = (rating) => {
    const stars = Math.round(rating || 0);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Stylist Details</h1>
          <button className="btn btn-secondary" onClick={() => setSelected(null)}>Back to List</button>
        </div>
        <div className="detail-view">
          <div className="detail-header">
            <h2>{selected.name}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Email</label><span>{selected.email || 'N/A'}</span></div>
            <div className="detail-field"><label>Phone</label><span>{selected.phone || 'N/A'}</span></div>
            <div className="detail-field"><label>Specialties</label><span>{selected.specialties || 'N/A'}</span></div>
            <div className="detail-field"><label>Experience</label><span>{selected.experience_years} years</span></div>
            <div className="detail-field"><label>Rating</label><span className="star-rating">{renderStars(selected.rating)} ({selected.rating})</span></div>
            <div className="detail-field"><label>Hourly Rate</label><span>${selected.hourly_rate}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Bio</label><span>{selected.bio || 'N/A'}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Stylists</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Stylist</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Stylist' : 'New Stylist'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Hourly Rate ($)</label>
                  <input type="number" value={form.hourly_rate} onChange={e => setForm({...form, hourly_rate: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Specialties</label>
                <input value={form.specialties} onChange={e => setForm({...form, specialties: e.target.value})} placeholder="e.g., Balayage, Color, Cuts" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Experience (years)</label>
                  <input type="number" value={form.experience_years} onChange={e => setForm({...form, experience_years: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Rating (1-5)</label>
                  <input type="number" step="0.01" min="1" max="5" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} />
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
              <th>Name</th>
              <th>Specialties</th>
              <th>Experience</th>
              <th>Rating</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {stylists.map(s => (
              <tr key={s.id} onClick={() => setSelected(s)}>
                <td><strong>{s.name}</strong></td>
                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.specialties}</td>
                <td>{s.experience_years} yrs</td>
                <td><span className="star-rating">{renderStars(s.rating)}</span></td>
                <td>${s.hourly_rate}/hr</td>
              </tr>
            ))}
          </tbody>
        </table>
        {stylists.length === 0 && <div className="empty-state"><h3>No stylists found</h3><p>Add your first stylist to get started.</p></div>}
      </div>
    </div>
  );
}

export default StylistsPage;
