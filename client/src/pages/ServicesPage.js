import React, { useState, useEffect } from 'react';
import { getServices, createService, updateService, deleteService } from '../services/api';

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', description: '', base_duration_min: '', price: '', difficulty_level: 'medium' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const res = await getServices();
    setServices(res.data);
  };

  const resetForm = () => {
    setForm({ name: '', category: '', description: '', base_duration_min: '', price: '', difficulty_level: 'medium' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateService(editing.id, form);
    } else {
      await createService(form);
    }
    resetForm();
    loadData();
    setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name, category: item.category || '', description: item.description || '',
      base_duration_min: item.base_duration_min || '', price: item.price || '', difficulty_level: item.difficulty_level || 'medium'
    });
    setEditing(item);
    setShowForm(true);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this service?')) {
      await deleteService(id);
      loadData();
      setSelected(null);
    }
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Service Details</h1>
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
            <div className="detail-field"><label>Category</label><span>{selected.category}</span></div>
            <div className="detail-field"><label>Duration</label><span>{selected.base_duration_min} minutes</span></div>
            <div className="detail-field"><label>Price</label><span>${selected.price}</span></div>
            <div className="detail-field"><label>Difficulty</label><span className={`badge badge-${selected.difficulty_level}`}>{selected.difficulty_level}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Description</label><span>{selected.description}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Services</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Service</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Service' : 'New Service'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="">Select...</option>
                    <option value="Hair">Hair</option>
                    <option value="Hair Color">Hair Color</option>
                    <option value="Hair Treatment">Hair Treatment</option>
                    <option value="Styling">Styling</option>
                    <option value="Skincare">Skincare</option>
                    <option value="Spa">Spa</option>
                    <option value="Nails">Nails</option>
                    <option value="Lashes">Lashes</option>
                    <option value="Brows">Brows</option>
                    <option value="Mens">Mens</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Duration (min)</label>
                  <input type="number" value={form.base_duration_min} onChange={e => setForm({...form, base_duration_min: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Price ($)</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Difficulty Level</label>
                <select value={form.difficulty_level} onChange={e => setForm({...form, difficulty_level: e.target.value})}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="advanced">Advanced</option>
                </select>
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
              <th>Category</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id} onClick={() => setSelected(s)}>
                <td><strong>{s.name}</strong></td>
                <td>{s.category}</td>
                <td>{s.base_duration_min} min</td>
                <td>${s.price}</td>
                <td><span className={`badge badge-${s.difficulty_level}`}>{s.difficulty_level}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {services.length === 0 && <div className="empty-state"><h3>No services found</h3></div>}
      </div>
    </div>
  );
}

export default ServicesPage;
