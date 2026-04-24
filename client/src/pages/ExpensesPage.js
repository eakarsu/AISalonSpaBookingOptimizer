import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const CATEGORIES = ['Rent','Utilities','Supplies','Equipment','Marketing','Insurance','Payroll','Training','Maintenance','Other'];
const PAYMENT_METHODS = ['Cash','Credit Card','Debit Card','Bank Transfer','Check'];

function ExpensesPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category: '', description: '', amount: '', vendor: '', payment_method: '', receipt_number: '', expense_date: '', is_recurring: false, recurrence_interval: '', notes: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { const r = await api.get('/expenses'); setItems(r.data); };

  const resetForm = () => { setForm({ category: '', description: '', amount: '', vendor: '', payment_method: '', receipt_number: '', expense_date: '', is_recurring: false, recurrence_interval: '', notes: '' }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/expenses/${editing.id}`, form);
    else await api.post('/expenses', form);
    resetForm(); loadData(); setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({ category: item.category || '', description: item.description || '', amount: item.amount || '', vendor: item.vendor || '', payment_method: item.payment_method || '', receipt_number: item.receipt_number || '', expense_date: item.expense_date ? item.expense_date.split('T')[0] : '', is_recurring: item.is_recurring || false, recurrence_interval: item.recurrence_interval || '', notes: item.notes || '' });
    setEditing(item); setShowForm(true); setSelected(null);
  };

  const handleDelete = async (id) => { if (window.confirm('Delete this expense?')) { await api.delete(`/expenses/${id}`); loadData(); setSelected(null); } };

  if (selected) {
    return (
      <div>
        <div className="page-header"><h1>Expense Details</h1><button className="btn btn-secondary" onClick={() => setSelected(null)}>Back to List</button></div>
        <div className="detail-view">
          <div className="detail-header">
            <h2>{selected.category}: {selected.description?.slice(0, 50)}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Category</label><span>{selected.category}</span></div>
            <div className="detail-field"><label>Amount</label><span>${selected.amount}</span></div>
            <div className="detail-field"><label>Vendor</label><span>{selected.vendor || 'N/A'}</span></div>
            <div className="detail-field"><label>Payment Method</label><span>{selected.payment_method || 'N/A'}</span></div>
            <div className="detail-field"><label>Receipt #</label><span>{selected.receipt_number || 'N/A'}</span></div>
            <div className="detail-field"><label>Date</label><span>{selected.expense_date ? new Date(selected.expense_date).toLocaleDateString() : 'N/A'}</span></div>
            <div className="detail-field"><label>Recurring</label><span>{selected.is_recurring ? `Yes (${selected.recurrence_interval})` : 'No'}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Description</label><span>{selected.description || 'N/A'}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Notes</label><span>{selected.notes || 'N/A'}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h1>Expenses</h1><button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Expense</button></div>
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Expense' : 'New Expense'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Category *</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required><option value="">Select...</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="form-group"><label>Amount ($) *</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label>Vendor</label><input value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} /></div>
                <div className="form-group"><label>Payment Method</label><select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}><option value="">Select...</option>{PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Receipt #</label><input value={form.receipt_number} onChange={e => setForm({...form, receipt_number: e.target.value})} /></div>
                <div className="form-group"><label>Date</label><input type="date" value={form.expense_date} onChange={e => setForm({...form, expense_date: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Recurring</label><select value={form.is_recurring ? 'true' : 'false'} onChange={e => setForm({...form, is_recurring: e.target.value === 'true'})}><option value="false">No</option><option value="true">Yes</option></select></div>
                {form.is_recurring && <div className="form-group"><label>Interval</label><select value={form.recurrence_interval} onChange={e => setForm({...form, recurrence_interval: e.target.value})}><option value="">Select...</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></div>}
              </div>
              <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Vendor</th><th>Payment</th><th>Recurring</th></tr></thead>
          <tbody>
            {items.map(e => (
              <tr key={e.id} onClick={() => setSelected(e)}>
                <td>{e.expense_date ? new Date(e.expense_date).toLocaleDateString() : '-'}</td>
                <td><strong>{e.category}</strong></td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</td>
                <td>${e.amount}</td><td>{e.vendor || '-'}</td><td>{e.payment_method || '-'}</td>
                <td>{e.is_recurring ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="empty-state"><h3>No expenses found</h3></div>}
      </div>
    </div>
  );
}

export default ExpensesPage;
