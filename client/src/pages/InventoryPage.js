import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import api from '../services/api';

const getInventoryLogs = () => api.get('/inventory');
const createInventoryLog = (data) => api.post('/inventory', data);
const updateInventoryLog = (id, data) => api.put(`/inventory/${id}`, data);
const deleteInventoryLog = (id) => api.delete(`/inventory/${id}`);

function InventoryPage() {
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ product_id: '', transaction_type: 'restock', quantity: '', unit_cost: '', total_cost: '', supplier: '', reference_number: '', notes: '', transaction_date: '' });

  useEffect(() => {
    loadData();
    getProducts().then((res) => {
      setProducts(res.data);
    });
  }, []);

  const loadData = async () => {
    const res = await getInventoryLogs();
    setLogs(res.data);
  };

  const resetForm = () => {
    setForm({ product_id: '', transaction_type: 'restock', quantity: '', unit_cost: '', total_cost: '', supplier: '', reference_number: '', notes: '', transaction_date: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateInventoryLog(editing.id, form);
    } else {
      await createInventoryLog(form);
    }
    resetForm();
    loadData();
    setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({
      product_id: item.product_id || '', transaction_type: item.transaction_type || 'restock',
      quantity: item.quantity || '', unit_cost: item.unit_cost || '', total_cost: item.total_cost || '',
      supplier: item.supplier || '', reference_number: item.reference_number || '', notes: item.notes || '',
      transaction_date: item.transaction_date ? item.transaction_date.split('T')[0] : ''
    });
    setEditing(item);
    setShowForm(true);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this inventory log?')) {
      await deleteInventoryLog(id);
      loadData();
      setSelected(null);
    }
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Inventory Log Details</h1>
          <button className="btn btn-secondary" onClick={() => setSelected(null)}>Back to List</button>
        </div>
        <div className="detail-view">
          <div className="detail-header">
            <h2>Inventory Log #{selected.id}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Product</label><span>{selected.product_name || 'N/A'}</span></div>
            <div className="detail-field"><label>Transaction Type</label><span>{selected.transaction_type || 'N/A'}</span></div>
            <div className="detail-field"><label>Quantity</label><span>{selected.quantity}</span></div>
            <div className="detail-field"><label>Unit Cost</label><span>${selected.unit_cost}</span></div>
            <div className="detail-field"><label>Total Cost</label><span>${selected.total_cost}</span></div>
            <div className="detail-field"><label>Supplier</label><span>{selected.supplier || 'N/A'}</span></div>
            <div className="detail-field"><label>Reference Number</label><span>{selected.reference_number || 'N/A'}</span></div>
            <div className="detail-field"><label>Date</label><span>{selected.transaction_date ? new Date(selected.transaction_date).toLocaleDateString() : 'N/A'}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Notes</label><span>{selected.notes || 'N/A'}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Inventory</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Inventory Log</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Inventory Log' : 'New Inventory Log'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Product *</label>
                  <select value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} required>
                    <option value="">Select product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Transaction Type *</label>
                  <select value={form.transaction_type} onChange={e => setForm({...form, transaction_type: e.target.value})} required>
                    <option value="restock">Restock</option>
                    <option value="sale">Sale</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="waste">Waste</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Unit Cost ($)</label>
                  <input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm({...form, unit_cost: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Cost ($)</label>
                  <input type="number" step="0.01" value={form.total_cost} onChange={e => setForm({...form, total_cost: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Transaction Date *</label>
                  <input type="date" value={form.transaction_date} onChange={e => setForm({...form, transaction_date: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier</label>
                  <input type="text" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Reference Number</label>
                  <input type="text" value={form.reference_number} onChange={e => setForm({...form, reference_number: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
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
              <th>Product</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th>Total Cost</th>
              <th>Supplier</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} onClick={() => setSelected(l)}>
                <td><strong>{l.product_name || '-'}</strong></td>
                <td>{l.transaction_type || '-'}</td>
                <td>{l.quantity}</td>
                <td>${l.unit_cost}</td>
                <td>${l.total_cost}</td>
                <td>{l.supplier || '-'}</td>
                <td>{l.transaction_date ? new Date(l.transaction_date).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="empty-state"><h3>No inventory logs found</h3></div>}
      </div>
    </div>
  );
}

export default InventoryPage;
