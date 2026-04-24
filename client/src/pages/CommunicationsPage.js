import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

function CommunicationsPage() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ client_id: '', type: 'email', subject: '', message: '', status: 'sent', campaign_name: '' });

  useEffect(() => { loadData(); api.get('/clients').then(r => setClients(r.data)); }, []);
  const loadData = async () => { const r = await api.get('/communications'); setItems(r.data); };

  const resetForm = () => { setForm({ client_id: '', type: 'email', subject: '', message: '', status: 'sent', campaign_name: '' }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/communications/${editing.id}`, form);
    else await api.post('/communications', form);
    resetForm(); loadData(); setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({ client_id: item.client_id || '', type: item.type || 'email', subject: item.subject || '', message: item.message || '', status: item.status || 'sent', campaign_name: item.campaign_name || '' });
    setEditing(item); setShowForm(true); setSelected(null);
  };

  const handleDelete = async (id) => { if (window.confirm('Delete this communication?')) { await api.delete(`/communications/${id}`); loadData(); setSelected(null); } };

  if (selected) {
    return (
      <div>
        <div className="page-header"><h1>Communication Details</h1><button className="btn btn-secondary" onClick={() => setSelected(null)}>Back to List</button></div>
        <div className="detail-view">
          <div className="detail-header">
            <h2>{selected.subject}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Client</label><span>{selected.client_name || 'N/A'}</span></div>
            <div className="detail-field"><label>Type</label><span>{selected.type}</span></div>
            <div className="detail-field"><label>Status</label><span className={`badge badge-${selected.status}`}>{selected.status}</span></div>
            <div className="detail-field"><label>Campaign</label><span>{selected.campaign_name || 'N/A'}</span></div>
            <div className="detail-field"><label>Sent At</label><span>{selected.sent_at ? new Date(selected.sent_at).toLocaleString() : 'N/A'}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Message</label><span>{selected.message || 'N/A'}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h1>Communications</h1><button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Message</button></div>
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Communication' : 'New Communication'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Client</label><select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}><option value="">Select client...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="form-group"><label>Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option value="email">Email</option><option value="sms">SMS</option><option value="push">Push</option><option value="in_app">In-App</option></select></div>
              </div>
              <div className="form-group"><label>Subject *</label><input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required /></div>
              <div className="form-group"><label>Message *</label><textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} required style={{ minHeight: '120px' }} /></div>
              <div className="form-row">
                <div className="form-group"><label>Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="draft">Draft</option><option value="sent">Sent</option><option value="delivered">Delivered</option><option value="failed">Failed</option></select></div>
                <div className="form-group"><label>Campaign Name</label><input value={form.campaign_name} onChange={e => setForm({...form, campaign_name: e.target.value})} /></div>
              </div>
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Send'}</button></div>
            </form>
          </div>
        </div>
      )}
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Client</th><th>Type</th><th>Subject</th><th>Status</th><th>Campaign</th><th>Sent</th></tr></thead>
          <tbody>
            {items.map(m => (
              <tr key={m.id} onClick={() => setSelected(m)}>
                <td><strong>{m.client_name || '-'}</strong></td><td>{m.type}</td>
                <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</td>
                <td><span className={`badge badge-${m.status}`}>{m.status}</span></td>
                <td>{m.campaign_name || '-'}</td>
                <td>{m.sent_at ? new Date(m.sent_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="empty-state"><h3>No communications found</h3></div>}
      </div>
    </div>
  );
}

export default CommunicationsPage;
