import React, { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', brand: '', category: '', description: '', price: '', stock_quantity: '', suitable_for: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const res = await getProducts();
    setProducts(res.data);
  };

  const resetForm = () => {
    setForm({ name: '', brand: '', category: '', description: '', price: '', stock_quantity: '', suitable_for: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateProduct(editing.id, form);
    } else {
      await createProduct(form);
    }
    resetForm();
    loadData();
    setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name, brand: item.brand || '', category: item.category || '',
      description: item.description || '', price: item.price || '',
      stock_quantity: item.stock_quantity || '', suitable_for: item.suitable_for || ''
    });
    setEditing(item);
    setShowForm(true);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      await deleteProduct(id);
      loadData();
      setSelected(null);
    }
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Product Details</h1>
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
            <div className="detail-field"><label>Brand</label><span>{selected.brand}</span></div>
            <div className="detail-field"><label>Category</label><span>{selected.category}</span></div>
            <div className="detail-field"><label>Price</label><span>${selected.price}</span></div>
            <div className="detail-field"><label>Stock</label><span>{selected.stock_quantity} units</span></div>
            <div className="detail-field"><label>Suitable For</label><span>{selected.suitable_for}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Description</label><span>{selected.description}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Product</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Product' : 'New Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="">Select...</option>
                    <option value="Shampoo">Shampoo</option>
                    <option value="Hair Oil">Hair Oil</option>
                    <option value="Treatment">Treatment</option>
                    <option value="Styling">Styling</option>
                    <option value="Color Care">Color Care</option>
                    <option value="Skincare">Skincare</option>
                    <option value="Nails">Nails</option>
                    <option value="Spa">Spa</option>
                    <option value="Lashes">Lashes</option>
                    <option value="Mens">Mens</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price ($)</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input type="number" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Suitable For</label>
                <input value={form.suitable_for} onChange={e => setForm({...form, suitable_for: e.target.value})} placeholder="e.g., All hair types, Dry skin" />
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
              <th>Brand</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} onClick={() => setSelected(p)}>
                <td><strong>{p.name}</strong></td>
                <td>{p.brand}</td>
                <td>{p.category}</td>
                <td>${p.price}</td>
                <td>{p.stock_quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <div className="empty-state"><h3>No products found</h3></div>}
      </div>
    </div>
  );
}

export default ProductsPage;
