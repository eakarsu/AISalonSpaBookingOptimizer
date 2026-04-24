import React, { useState, useEffect } from 'react';
import { getClients } from '../services/api';
import api from '../services/api';

const getLoyalty = () => api.get('/loyalty');
const createLoyalty = (data) => api.post('/loyalty', data);
const updateLoyalty = (id, data) => api.put(`/loyalty/${id}`, data);
const deleteLoyalty = (id) => api.delete(`/loyalty/${id}`);

function LoyaltyPage() {
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ client_id: '', points_earned: '', points_redeemed: '', balance: '', source: 'booking', description: '', transaction_date: '' });

  useEffect(() => {
    loadData();
    getClients().then(res => setClients(res.data));
  }, []);

  const loadData = async () => {
    const res = await getLoyalty();
    setRecords(res.data);
  };

  const resetForm = () => {
    setForm({ client_id: '', points_earned: '', points_redeemed: '', balance: '', source: 'booking', description: '', transaction_date: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateLoyalty(editing.id, form);
    } else {
      await createLoyalty(form);
    }
    resetForm();
    loadData();
    setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({
      client_id: item.client_id || '', points_earned: item.points_earned || '', points_redeemed: item.points_redeemed || '',
      balance: item.balance || '', source: item.source || 'booking', description: item.description || '',
      transaction_date: item.transaction_date ? item.transaction_date.split('T')[0] : ''
    });
    setEditing(item);
    setShowForm(true);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this loyalty record?')) {
      await deleteLoyalty(id);
      loadData();
      setSelected(null);
    }
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Loyalty Details</h1>
          <button className="btn btn-secondary" onClick={() => setSelected(null)}>Back to List</button>
        </div>
        <div className="detail-view">
          <div className="detail-header">
            <h2>Loyalty #{selected.id}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Client</label><span>{selected.client_name || 'N/A'}</span></div>
            <div className="detail-field"><label>Points Earned</label><span>{selected.points_earned}</span></div>
            <div className="detail-field"><label>Points Redeemed</label><span>{selected.points_redeemed}</span></div>
            <div className="detail-field"><label>Balance</label><span>{selected.balance}</span></div>
            <div className="detail-field"><label>Source</label><span className="badge">{selected.source}</span></div>
            <div className="detail-field"><label>Date</label><span>{selected.transaction_date ? new Date(selected.transaction_date).toLocaleDateString() : 'N/A'}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Description</label><span>{selected.description || 'N/A'}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Loyalty Program</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Record</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Loyalty Record' : 'New Loyalty Record'}</h2>
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
                  <label>Source *</label>
                  <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} required>
                    <option value="booking">Booking</option>
                    <option value="referral">Referral</option>
                    <option value="review">Review</option>
                    <option value="promo">Promo</option>
                    <option value="purchase">Purchase</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Points Earned</label>
                  <input type="number" value={form.points_earned} onChange={e => setForm({...form, points_earned: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Points Redeemed</label>
                  <input type="number" value={form.points_redeemed} onChange={e => setForm({...form, points_redeemed: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Balance</label>
                  <input type="number" value={form.balance} onChange={e => setForm({...form, balance: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={form.transaction_date} onChange={e => setForm({...form, transaction_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
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
              <th>Points Earned</th>
              <th>Points Redeemed</th>
              <th>Balance</th>
              <th>Source</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} onClick={() => setSelected(r)}>
                <td><strong>{r.client_name || '-'}</strong></td>
                <td>{r.points_earned}</td>
                <td>{r.points_redeemed}</td>
                <td>{r.balance}</td>
                <td><span className="badge">{r.source}</span></td>
                <td>{r.transaction_date ? new Date(r.transaction_date).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && <div className="empty-state"><h3>No loyalty records found</h3></div>}
      </div>
    </div>
  );
}

export default LoyaltyPage;
