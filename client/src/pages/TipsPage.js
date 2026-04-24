import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Venmo', 'Other'];

function TipsPage() {
  const [tips, setTips] = useState([]);
  const [summary, setSummary] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState('list');
  const [form, setForm] = useState({ stylist_id: '', client_id: '', service_id: '', amount: '', payment_method: 'Cash', tip_date: '', notes: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    const [t, s, st, cl, sv] = await Promise.all([
      api.get('/tips'), api.get('/tips/summary'), api.get('/stylists'), api.get('/clients'), api.get('/services')
    ]);
    setTips(t.data); setSummary(s.data); setStylists(st.data); setClients(cl.data); setServices(sv.data);
  };

  const resetForm = () => { setForm({ stylist_id: '', client_id: '', service_id: '', amount: '', payment_method: 'Cash', tip_date: '', notes: '' }); setShowForm(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/tips', form);
    resetForm(); loadData();
  };

  const handleDelete = async (id) => { if (window.confirm('Delete this tip record?')) { await api.delete(`/tips/${id}`); loadData(); } };

  const totalTips = tips.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Tips Tracking</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn ${view === 'list' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setView('list')}>Tip Log</button>
          <button className={`btn ${view === 'summary' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setView('summary')}>By Stylist</button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Record Tip</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Tips</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10B981' }}>${totalTips.toFixed(2)}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Entries</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{tips.length}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Average Tip</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#6366F1' }}>${tips.length ? (totalTips / tips.length).toFixed(2) : '0.00'}</div>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>Record Tip</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Stylist *</label><select value={form.stylist_id} onChange={e => setForm({...form, stylist_id: e.target.value})} required><option value="">Select...</option>{stylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div className="form-group"><label>Client</label><select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}><option value="">Select...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Service</label><select value={form.service_id} onChange={e => setForm({...form, service_id: e.target.value})}><option value="">Select...</option>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div className="form-group"><label>Amount ($) *</label><input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Payment Method</label><select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}>{PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div className="form-group"><label>Date</label><input type="date" value={form.tip_date} onChange={e => setForm({...form, tip_date: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button><button type="submit" className="btn btn-primary">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Stylist</th><th>Client</th><th>Service</th><th>Amount</th><th>Payment</th><th>Actions</th></tr></thead>
            <tbody>
              {tips.map(t => (
                <tr key={t.id}>
                  <td>{t.tip_date ? new Date(t.tip_date).toLocaleDateString() : '-'}</td>
                  <td><strong>{t.stylist_name}</strong></td>
                  <td>{t.client_name || '-'}</td>
                  <td>{t.service_name || '-'}</td>
                  <td style={{ color: '#10B981', fontWeight: 600 }}>${parseFloat(t.amount).toFixed(2)}</td>
                  <td>{t.payment_method}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {tips.length === 0 && <div className="empty-state"><h3>No tips recorded</h3><p>Record tips to track stylist earnings</p></div>}
        </div>
      )}

      {view === 'summary' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead><tr><th>Stylist</th><th>Total Tips</th><th>Tip Count</th><th>Average Tip</th></tr></thead>
            <tbody>
              {summary.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.stylist_name}</strong></td>
                  <td style={{ color: '#10B981', fontWeight: 600 }}>${parseFloat(s.total_amount).toFixed(2)}</td>
                  <td>{s.total_tips}</td>
                  <td>${parseFloat(s.avg_tip).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TipsPage;
