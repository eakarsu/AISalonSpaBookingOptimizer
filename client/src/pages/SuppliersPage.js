import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '', product_categories: '', payment_terms: '', notes: '' });
  const [orderForm, setOrderForm] = useState({ supplier_id: '', items: '', total_amount: '', order_date: '', expected_delivery: '', notes: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { const r = await api.get('/suppliers'); setSuppliers(r.data); };
  const loadOrders = async (id) => { const r = await api.get(`/suppliers/${id}/orders`); setOrders(r.data); };

  const resetForm = () => { setForm({ name: '', contact_person: '', email: '', phone: '', address: '', product_categories: '', payment_terms: '', notes: '' }); setEditing(null); setShowForm(false); };
  const resetOrderForm = () => { setOrderForm({ supplier_id: '', items: '', total_amount: '', order_date: '', expected_delivery: '', notes: '' }); setShowOrderForm(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/suppliers/${editing.id}`, form);
    else await api.post('/suppliers', form);
    resetForm(); loadData(); setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({ name: item.name || '', contact_person: item.contact_person || '', email: item.email || '', phone: item.phone || '', address: item.address || '', product_categories: item.product_categories || '', payment_terms: item.payment_terms || '', notes: item.notes || '' });
    setEditing(item); setShowForm(true); setSelected(null);
  };

  const handleDelete = async (id) => { if (window.confirm('Delete this supplier?')) { await api.delete(`/suppliers/${id}`); loadData(); setSelected(null); } };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    await api.post('/suppliers/orders', orderForm);
    resetOrderForm(); if (selected) loadOrders(selected.id);
  };

  const handleOrderStatus = async (orderId, status) => {
    await api.put(`/suppliers/orders/${orderId}`, { status });
    if (selected) loadOrders(selected.id);
  };

  const selectSupplier = (s) => { setSelected(s); loadOrders(s.id); };

  if (selected) {
    return (
      <div>
        <div className="page-header"><h1>Supplier Details</h1><button className="btn btn-secondary" onClick={() => setSelected(null)}>Back to List</button></div>
        <div className="detail-view">
          <div className="detail-header">
            <h2>{selected.name}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Contact</label><span>{selected.contact_person || 'N/A'}</span></div>
            <div className="detail-field"><label>Email</label><span>{selected.email || 'N/A'}</span></div>
            <div className="detail-field"><label>Phone</label><span>{selected.phone || 'N/A'}</span></div>
            <div className="detail-field"><label>Payment Terms</label><span>{selected.payment_terms || 'N/A'}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Address</label><span>{selected.address || 'N/A'}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Product Categories</label><span>{selected.product_categories || 'N/A'}</span></div>
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <div className="page-header">
            <h2>Orders</h2>
            <button className="btn btn-primary btn-sm" onClick={() => { setOrderForm({ ...orderForm, supplier_id: selected.id }); setShowOrderForm(true); }}>+ New Order</button>
          </div>

          {showOrderForm && (
            <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetOrderForm()}>
              <div className="modal">
                <h2>New Order</h2>
                <form onSubmit={handleOrderSubmit}>
                  <div className="form-group"><label>Items *</label><textarea value={orderForm.items} onChange={e => setOrderForm({...orderForm, items: e.target.value})} placeholder="List items ordered..." required /></div>
                  <div className="form-row">
                    <div className="form-group"><label>Total Amount ($) *</label><input type="number" step="0.01" value={orderForm.total_amount} onChange={e => setOrderForm({...orderForm, total_amount: e.target.value})} required /></div>
                    <div className="form-group"><label>Order Date</label><input type="date" value={orderForm.order_date} onChange={e => setOrderForm({...orderForm, order_date: e.target.value})} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Expected Delivery</label><input type="date" value={orderForm.expected_delivery} onChange={e => setOrderForm({...orderForm, expected_delivery: e.target.value})} /></div>
                  </div>
                  <div className="form-group"><label>Notes</label><textarea value={orderForm.notes} onChange={e => setOrderForm({...orderForm, notes: e.target.value})} /></div>
                  <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={resetOrderForm}>Cancel</button><button type="submit" className="btn btn-primary">Create Order</button></div>
                </form>
              </div>
            </div>
          )}

          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>Order Date</th><th>Items</th><th>Total</th><th>Expected Delivery</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>{o.order_date ? new Date(o.order_date).toLocaleDateString() : '-'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.items}</td>
                    <td>${parseFloat(o.total_amount).toFixed(2)}</td>
                    <td>{o.expected_delivery ? new Date(o.expected_delivery).toLocaleDateString() : '-'}</td>
                    <td><span style={{
                      background: o.status === 'delivered' ? '#10B98120' : o.status === 'shipped' ? '#3B82F620' : '#F59E0B20',
                      color: o.status === 'delivered' ? '#10B981' : o.status === 'shipped' ? '#3B82F6' : '#F59E0B',
                      padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600
                    }}>{o.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {o.status === 'pending' && <button className="btn btn-primary btn-sm" onClick={() => handleOrderStatus(o.id, 'shipped')}>Ship</button>}
                        {o.status === 'shipped' && <button className="btn btn-primary btn-sm" style={{ background: '#10B981' }} onClick={() => handleOrderStatus(o.id, 'delivered')}>Delivered</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <div className="empty-state"><h3>No orders yet</h3></div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h1>Suppliers</h1><button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Add Supplier</button></div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Supplier' : 'Add Supplier'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Company Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div className="form-group"><label>Contact Person</label><input value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Address</label><textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label>Product Categories</label><input value={form.product_categories} onChange={e => setForm({...form, product_categories: e.target.value})} placeholder="e.g. Hair Care, Skincare" /></div>
                <div className="form-group"><label>Payment Terms</label><input value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})} placeholder="e.g. Net 30" /></div>
              </div>
              <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Company</th><th>Contact</th><th>Email</th><th>Phone</th><th>Categories</th><th>Terms</th></tr></thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} onClick={() => selectSupplier(s)} style={{ cursor: 'pointer' }}>
                <td><strong>{s.name}</strong></td>
                <td>{s.contact_person || '-'}</td>
                <td>{s.email || '-'}</td>
                <td>{s.phone || '-'}</td>
                <td>{s.product_categories || '-'}</td>
                <td>{s.payment_terms || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {suppliers.length === 0 && <div className="empty-state"><h3>No suppliers added</h3><p>Add suppliers to track your product vendors</p></div>}
      </div>
    </div>
  );
}

export default SuppliersPage;
