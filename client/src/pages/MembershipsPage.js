import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

function MembershipsPage() {
  const [memberships, setMemberships] = useState([]);
  const [plans, setPlans] = useState([]);
  const [clients, setClients] = useState([]);
  const [view, setView] = useState('memberships');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('membership');
  const [mForm, setMForm] = useState({ client_id: '', plan_id: '', start_date: '', payment_method: 'credit_card' });
  const [pForm, setPForm] = useState({ name: '', description: '', price: '', billing_cycle: 'monthly', included_services: '', max_bookings_per_month: '', discount_percent: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    const [m, p, c] = await Promise.all([api.get('/memberships'), api.get('/memberships/plans'), api.get('/clients')]);
    setMemberships(m.data); setPlans(p.data); setClients(c.data);
  };

  const resetForm = () => { setShowForm(false); setMForm({ client_id: '', plan_id: '', start_date: '', payment_method: 'credit_card' }); setPForm({ name: '', description: '', price: '', billing_cycle: 'monthly', included_services: '', max_bookings_per_month: '', discount_percent: '' }); };

  const handleMembershipSubmit = async (e) => { e.preventDefault(); await api.post('/memberships', mForm); resetForm(); loadData(); };
  const handlePlanSubmit = async (e) => { e.preventDefault(); await api.post('/memberships/plans', pForm); resetForm(); loadData(); };
  const handleCancel = async (id) => { if (window.confirm('Cancel this membership?')) { await api.put(`/memberships/${id}/cancel`); loadData(); } };
  const handleDeletePlan = async (id) => { if (window.confirm('Delete this plan?')) { await api.delete(`/memberships/plans/${id}`); loadData(); } };

  const activeMemberships = memberships.filter(m => m.status === 'active').length;
  const monthlyRevenue = memberships.filter(m => m.status === 'active').reduce((sum, m) => sum + parseFloat(m.price || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Memberships</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn ${view === 'memberships' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setView('memberships')}>Members</button>
          <button className={`btn ${view === 'plans' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setView('plans')}>Plans</button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setFormType(view === 'plans' ? 'plan' : 'membership'); setShowForm(true); }}>+ {view === 'plans' ? 'New Plan' : 'Add Member'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active Members</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10B981' }}>{activeMemberships}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Monthly Revenue</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#6366F1' }}>${monthlyRevenue.toFixed(2)}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Available Plans</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{plans.length}</div>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            {formType === 'membership' ? (
              <>
                <h2>Add Membership</h2>
                <form onSubmit={handleMembershipSubmit}>
                  <div className="form-row">
                    <div className="form-group"><label>Client *</label><select value={mForm.client_id} onChange={e => setMForm({...mForm, client_id: e.target.value})} required><option value="">Select client...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div className="form-group"><label>Plan *</label><select value={mForm.plan_id} onChange={e => setMForm({...mForm, plan_id: e.target.value})} required><option value="">Select plan...</option>{plans.map(p => <option key={p.id} value={p.id}>{p.name} - ${p.price}/{p.billing_cycle}</option>)}</select></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Start Date *</label><input type="date" value={mForm.start_date} onChange={e => setMForm({...mForm, start_date: e.target.value})} required /></div>
                    <div className="form-group"><label>Payment Method</label><select value={mForm.payment_method} onChange={e => setMForm({...mForm, payment_method: e.target.value})}><option value="credit_card">Credit Card</option><option value="debit_card">Debit Card</option><option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option></select></div>
                  </div>
                  <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button><button type="submit" className="btn btn-primary">Add</button></div>
                </form>
              </>
            ) : (
              <>
                <h2>Create Plan</h2>
                <form onSubmit={handlePlanSubmit}>
                  <div className="form-row">
                    <div className="form-group"><label>Plan Name *</label><input value={pForm.name} onChange={e => setPForm({...pForm, name: e.target.value})} required /></div>
                    <div className="form-group"><label>Price ($) *</label><input type="number" step="0.01" value={pForm.price} onChange={e => setPForm({...pForm, price: e.target.value})} required /></div>
                  </div>
                  <div className="form-group"><label>Description</label><textarea value={pForm.description} onChange={e => setPForm({...pForm, description: e.target.value})} /></div>
                  <div className="form-row">
                    <div className="form-group"><label>Billing Cycle</label><select value={pForm.billing_cycle} onChange={e => setPForm({...pForm, billing_cycle: e.target.value})}><option value="monthly">Monthly</option><option value="annual">Annual</option></select></div>
                    <div className="form-group"><label>Max Bookings/Month</label><input type="number" value={pForm.max_bookings_per_month} onChange={e => setPForm({...pForm, max_bookings_per_month: e.target.value})} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Included Services</label><input value={pForm.included_services} onChange={e => setPForm({...pForm, included_services: e.target.value})} placeholder="e.g. Haircut, Blowout, Manicure" /></div>
                    <div className="form-group"><label>Discount %</label><input type="number" min="0" max="100" value={pForm.discount_percent} onChange={e => setPForm({...pForm, discount_percent: e.target.value})} /></div>
                  </div>
                  <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'memberships' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead><tr><th>Client</th><th>Plan</th><th>Price</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {memberships.map(m => (
                <tr key={m.id}>
                  <td><strong>{m.client_name}</strong><br/><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.client_email}</span></td>
                  <td>{m.plan_name}</td>
                  <td>${parseFloat(m.price).toFixed(2)}</td>
                  <td>{m.start_date ? new Date(m.start_date).toLocaleDateString() : '-'}</td>
                  <td>{m.end_date ? new Date(m.end_date).toLocaleDateString() : '-'}</td>
                  <td><span style={{ background: m.status === 'active' ? '#10B98120' : '#EF444420', color: m.status === 'active' ? '#10B981' : '#EF4444', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>{m.status}</span></td>
                  <td>{m.status === 'active' && <button className="btn btn-danger btn-sm" onClick={() => handleCancel(m.id)}>Cancel</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {memberships.length === 0 && <div className="empty-state"><h3>No memberships yet</h3><p>Create plans first, then add members</p></div>}
        </div>
      )}

      {view === 'plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {plans.map(p => (
            <div key={p.id} style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{p.name}</h3>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeletePlan(p.id)}>Delete</button>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6366F1', marginBottom: '8px' }}>${parseFloat(p.price).toFixed(2)}<span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/{p.billing_cycle}</span></div>
              {p.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>{p.description}</p>}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {p.max_bookings_per_month && <div>Max {p.max_bookings_per_month} bookings/month</div>}
                {p.discount_percent > 0 && <div>{p.discount_percent}% discount on services</div>}
                {p.included_services && <div>Includes: {p.included_services}</div>}
              </div>
            </div>
          ))}
          {plans.length === 0 && <div className="empty-state"><h3>No plans created</h3><p>Create membership plans to offer to clients</p></div>}
        </div>
      )}
    </div>
  );
}

export default MembershipsPage;
