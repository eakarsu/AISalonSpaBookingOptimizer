import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

function GiftCardsPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', purchaser_name: '', purchaser_email: '', recipient_name: '', recipient_email: '', original_amount: '', remaining_balance: '', status: 'active', expiry_date: '', notes: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { const r = await api.get('/giftcards'); setItems(r.data); };

  const resetForm = () => { setForm({ code: '', purchaser_name: '', purchaser_email: '', recipient_name: '', recipient_email: '', original_amount: '', remaining_balance: '', status: 'active', expiry_date: '', notes: '' }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/giftcards/${editing.id}`, form);
    else await api.post('/giftcards', form);
    resetForm(); loadData(); setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({ code: item.code || '', purchaser_name: item.purchaser_name || '', purchaser_email: item.purchaser_email || '', recipient_name: item.recipient_name || '', recipient_email: item.recipient_email || '', original_amount: item.original_amount || '', remaining_balance: item.remaining_balance || '', status: item.status || 'active', expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '', notes: item.notes || '' });
    setEditing(item); setShowForm(true); setSelected(null);
  };

  const handleDelete = async (id) => { if (window.confirm('Delete this gift card?')) { await api.delete(`/giftcards/${id}`); loadData(); setSelected(null); } };

  if (selected) {
    return (
      <div>
        <div className="page-header"><h1>Gift Card Details</h1><button className="btn btn-secondary" onClick={() => setSelected(null)}>Back to List</button></div>
        <div className="detail-view">
          <div className="detail-header">
            <h2>{selected.code}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Code</label><span>{selected.code}</span></div>
            <div className="detail-field"><label>Status</label><span className={`badge badge-${selected.status}`}>{selected.status}</span></div>
            <div className="detail-field"><label>Purchaser</label><span>{selected.purchaser_name}</span></div>
            <div className="detail-field"><label>Purchaser Email</label><span>{selected.purchaser_email}</span></div>
            <div className="detail-field"><label>Recipient</label><span>{selected.recipient_name}</span></div>
            <div className="detail-field"><label>Recipient Email</label><span>{selected.recipient_email}</span></div>
            <div className="detail-field"><label>Original Amount</label><span>${selected.original_amount}</span></div>
            <div className="detail-field"><label>Remaining Balance</label><span>${selected.remaining_balance}</span></div>
            <div className="detail-field"><label>Expiry Date</label><span>{selected.expiry_date ? new Date(selected.expiry_date).toLocaleDateString() : 'N/A'}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Notes</label><span>{selected.notes || 'N/A'}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h1>Gift Cards</h1><button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Gift Card</button></div>
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Gift Card' : 'New Gift Card'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Code *</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value})} required placeholder="e.g., GIFT-2025-001" /></div>
                <div className="form-group"><label>Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="active">Active</option><option value="redeemed">Redeemed</option><option value="expired">Expired</option></select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Purchaser Name</label><input value={form.purchaser_name} onChange={e => setForm({...form, purchaser_name: e.target.value})} /></div>
                <div className="form-group"><label>Purchaser Email</label><input type="email" value={form.purchaser_email} onChange={e => setForm({...form, purchaser_email: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Recipient Name</label><input value={form.recipient_name} onChange={e => setForm({...form, recipient_name: e.target.value})} /></div>
                <div className="form-group"><label>Recipient Email</label><input type="email" value={form.recipient_email} onChange={e => setForm({...form, recipient_email: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Original Amount ($)</label><input type="number" step="0.01" value={form.original_amount} onChange={e => setForm({...form, original_amount: e.target.value})} /></div>
                <div className="form-group"><label>Remaining Balance ($)</label><input type="number" step="0.01" value={form.remaining_balance} onChange={e => setForm({...form, remaining_balance: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Expiry Date</label><input type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} /></div>
              <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Code</th><th>Purchaser</th><th>Recipient</th><th>Amount</th><th>Balance</th><th>Status</th><th>Expiry</th></tr></thead>
          <tbody>
            {items.map(g => (
              <tr key={g.id} onClick={() => setSelected(g)}>
                <td><strong>{g.code}</strong></td><td>{g.purchaser_name}</td><td>{g.recipient_name}</td>
                <td>${g.original_amount}</td><td>${g.remaining_balance}</td>
                <td><span className={`badge badge-${g.status}`}>{g.status}</span></td>
                <td>{g.expiry_date ? new Date(g.expiry_date).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="empty-state"><h3>No gift cards found</h3></div>}
      </div>
    </div>
  );
}

export default GiftCardsPage;
