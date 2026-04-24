import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

function PayrollPage() {
  const [payroll, setPayroll] = useState([]);
  const [summary, setSummary] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [view, setView] = useState('summary');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ stylist_id: '', pay_period_start: '', pay_period_end: '', base_pay: '', commission_amount: '', tips_amount: '', deductions: '', bonus: '', notes: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    const [p, s, st] = await Promise.all([api.get('/payroll'), api.get('/payroll/summary'), api.get('/stylists')]);
    setPayroll(p.data); setSummary(s.data); setStylists(st.data);
  };

  const resetForm = () => { setForm({ stylist_id: '', pay_period_start: '', pay_period_end: '', base_pay: '', commission_amount: '', tips_amount: '', deductions: '', bonus: '', notes: '' }); setShowForm(false); };

  const handleSubmit = async (e) => { e.preventDefault(); await api.post('/payroll', form); resetForm(); loadData(); };
  const handleStatus = async (id, status) => { await api.put(`/payroll/${id}`, { status }); loadData(); };
  const handleDelete = async (id) => { if (window.confirm('Delete this payroll record?')) { await api.delete(`/payroll/${id}`); loadData(); } };

  const totalPayroll = payroll.reduce((sum, p) => sum + parseFloat(p.total_pay || 0), 0);
  const pendingCount = payroll.filter(p => p.status === 'pending').length;

  return (
    <div>
      <div className="page-header">
        <h1>Payroll & Commissions</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn ${view === 'summary' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setView('summary')}>Summary</button>
          <button className={`btn ${view === 'records' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setView('records')}>Pay Records</button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Create Pay Record</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Payroll</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10B981' }}>${totalPayroll.toFixed(2)}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pay Records</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{payroll.length}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pending Payments</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#F59E0B' }}>{pendingCount}</div>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>Create Pay Record</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Stylist *</label><select value={form.stylist_id} onChange={e => setForm({...form, stylist_id: e.target.value})} required><option value="">Select...</option>{stylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div className="form-row">
                <div className="form-group"><label>Period Start *</label><input type="date" value={form.pay_period_start} onChange={e => setForm({...form, pay_period_start: e.target.value})} required /></div>
                <div className="form-group"><label>Period End *</label><input type="date" value={form.pay_period_end} onChange={e => setForm({...form, pay_period_end: e.target.value})} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Base Pay ($)</label><input type="number" step="0.01" value={form.base_pay} onChange={e => setForm({...form, base_pay: e.target.value})} /></div>
                <div className="form-group"><label>Commission ($)</label><input type="number" step="0.01" value={form.commission_amount} onChange={e => setForm({...form, commission_amount: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Tips ($)</label><input type="number" step="0.01" value={form.tips_amount} onChange={e => setForm({...form, tips_amount: e.target.value})} /></div>
                <div className="form-group"><label>Bonus ($)</label><input type="number" step="0.01" value={form.bonus} onChange={e => setForm({...form, bonus: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Deductions ($)</label><input type="number" step="0.01" value={form.deductions} onChange={e => setForm({...form, deductions: e.target.value})} /></div>
              <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
            </form>
          </div>
        </div>
      )}

      {view === 'summary' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead><tr><th>Stylist</th><th>Hourly Rate</th><th>Total Revenue</th><th>Bookings</th><th>Est. Commission (40%)</th><th>Total Tips</th></tr></thead>
            <tbody>
              {summary.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.stylist_name}</strong></td>
                  <td>${parseFloat(s.hourly_rate).toFixed(2)}/hr</td>
                  <td>${parseFloat(s.total_revenue).toFixed(2)}</td>
                  <td>{s.total_bookings}</td>
                  <td style={{ color: '#10B981', fontWeight: 600 }}>${parseFloat(s.estimated_commission).toFixed(2)}</td>
                  <td style={{ color: '#6366F1', fontWeight: 600 }}>${parseFloat(s.total_tips).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'records' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead><tr><th>Stylist</th><th>Period</th><th>Base</th><th>Commission</th><th>Tips</th><th>Bonus</th><th>Deductions</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {payroll.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.stylist_name}</strong></td>
                  <td style={{ fontSize: '0.85rem' }}>{p.pay_period_start ? new Date(p.pay_period_start).toLocaleDateString() : ''} - {p.pay_period_end ? new Date(p.pay_period_end).toLocaleDateString() : ''}</td>
                  <td>${parseFloat(p.base_pay || 0).toFixed(2)}</td>
                  <td>${parseFloat(p.commission_amount || 0).toFixed(2)}</td>
                  <td>${parseFloat(p.tips_amount || 0).toFixed(2)}</td>
                  <td>${parseFloat(p.bonus || 0).toFixed(2)}</td>
                  <td style={{ color: '#EF4444' }}>-${parseFloat(p.deductions || 0).toFixed(2)}</td>
                  <td style={{ fontWeight: 700, color: '#10B981' }}>${parseFloat(p.total_pay || 0).toFixed(2)}</td>
                  <td><span style={{
                    background: p.status === 'paid' ? '#10B98120' : '#F59E0B20',
                    color: p.status === 'paid' ? '#10B981' : '#F59E0B',
                    padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600
                  }}>{p.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {p.status === 'pending' && <button className="btn btn-primary btn-sm" onClick={() => handleStatus(p.id, 'paid')}>Mark Paid</button>}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payroll.length === 0 && <div className="empty-state"><h3>No payroll records</h3><p>Create pay records for your staff</p></div>}
        </div>
      )}
    </div>
  );
}

export default PayrollPage;
