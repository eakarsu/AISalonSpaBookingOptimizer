import React, { useState, useEffect } from 'react';
import api from '../services/api';

function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', discount_type: 'percentage', discount_value: '', applicable_services: '', start_date: '', end_date: '', min_purchase: '', max_uses: '', status: 'active', promo_code: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const res = await api.get('/promotions');
    setPromotions(res.data);
  };

  const resetForm = () => {
    setForm({ name: '', description: '', discount_type: 'percentage', discount_value: '', applicable_services: '', start_date: '', end_date: '', min_purchase: '', max_uses: '', status: 'active', promo_code: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/promotions/${editing.id}`, form);
    } else {
      await api.post('/promotions', form);
    }
    resetForm();
    loadData();
    setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name, description: item.description || '', discount_type: item.discount_type || 'percentage',
      discount_value: item.discount_value || '', applicable_services: item.applicable_services || '',
      start_date: item.start_date ? item.start_date.substring(0, 10) : '', end_date: item.end_date ? item.end_date.substring(0, 10) : '',
      min_purchase: item.min_purchase || '', max_uses: item.max_uses || '', status: item.status || 'active', promo_code: item.promo_code || ''
    });
    setEditing(item);
    setShowForm(true);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this promotion?')) {
      await api.delete(`/promotions/${id}`);
      loadData();
      setSelected(null);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Promotion Details</h1>
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
            <div className="detail-field"><label>Discount Type</label><span>{selected.discount_type}</span></div>
            <div className="detail-field"><label>Discount Value</label><span>{selected.discount_type === 'percentage' ? `${selected.discount_value}%` : `$${selected.discount_value}`}</span></div>
            <div className="detail-field"><label>Promo Code</label><span>{selected.promo_code || '-'}</span></div>
            <div className="detail-field"><label>Status</label><span className={`badge badge-${selected.status}`}>{selected.status}</span></div>
            <div className="detail-field"><label>Start Date</label><span>{formatDate(selected.start_date)}</span></div>
            <div className="detail-field"><label>End Date</label><span>{formatDate(selected.end_date)}</span></div>
            <div className="detail-field"><label>Min Purchase</label><span>{selected.min_purchase ? `$${selected.min_purchase}` : '-'}</span></div>
            <div className="detail-field"><label>Usage</label><span>{selected.current_uses || 0} / {selected.max_uses || 'Unlimited'}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Applicable Services</label><span>{selected.applicable_services || 'All services'}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Description</label><span>{selected.description || '-'}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Promotions & Discounts</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Promotion</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Promotion' : 'New Promotion'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Promo Code</label>
                  <input value={form.promo_code} onChange={e => setForm({...form, promo_code: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})} required>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input type="number" step="0.01" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Min Purchase ($)</label>
                  <input type="number" step="0.01" value={form.min_purchase} onChange={e => setForm({...form, min_purchase: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Max Uses</label>
                  <input type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Applicable Services</label>
                  <input value={form.applicable_services} onChange={e => setForm({...form, applicable_services: e.target.value})} placeholder="All services if empty" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
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
              <th>Type</th>
              <th>Discount Value</th>
              <th>Dates</th>
              <th>Status</th>
              <th>Promo Code</th>
              <th>Usage</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map(p => (
              <tr key={p.id} onClick={() => setSelected(p)}>
                <td><strong>{p.name}</strong></td>
                <td>{p.discount_type}</td>
                <td>{p.discount_type === 'percentage' ? `${p.discount_value}%` : `$${p.discount_value}`}</td>
                <td>{formatDate(p.start_date)} - {formatDate(p.end_date)}</td>
                <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                <td>{p.promo_code || '-'}</td>
                <td>{p.current_uses || 0} / {p.max_uses || '∞'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {promotions.length === 0 && <div className="empty-state"><h3>No promotions found</h3></div>}
      </div>
    </div>
  );
}

export default PromotionsPage;
