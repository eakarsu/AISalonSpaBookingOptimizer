import React, { useState, useEffect } from 'react';
import { getClients, createClient, updateClient, deleteClient } from '../services/api';

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', preferences: '', hair_type: '', skin_type: '', allergies: '', notes: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const res = await getClients();
    setClients(res.data);
  };

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', preferences: '', hair_type: '', skin_type: '', allergies: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateClient(editing.id, form);
    } else {
      await createClient(form);
    }
    resetForm();
    loadData();
    setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name, email: item.email || '', phone: item.phone || '',
      preferences: item.preferences || '', hair_type: item.hair_type || '',
      skin_type: item.skin_type || '', allergies: item.allergies || '', notes: item.notes || ''
    });
    setEditing(item);
    setShowForm(true);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this client?')) {
      await deleteClient(id);
      loadData();
      setSelected(null);
    }
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Client Details</h1>
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
            <div className="detail-field"><label>Email</label><span>{selected.email || 'N/A'}</span></div>
            <div className="detail-field"><label>Phone</label><span>{selected.phone || 'N/A'}</span></div>
            <div className="detail-field"><label>Hair Type</label><span>{selected.hair_type || 'N/A'}</span></div>
            <div className="detail-field"><label>Skin Type</label><span>{selected.skin_type || 'N/A'}</span></div>
            <div className="detail-field"><label>Allergies</label><span>{selected.allergies || 'None'}</span></div>
            <div className="detail-field"><label>Preferences</label><span>{selected.preferences || 'N/A'}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Notes</label><span>{selected.notes || 'N/A'}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Clients</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Client</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Client' : 'New Client'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Hair Type</label>
                  <input value={form.hair_type} onChange={e => setForm({...form, hair_type: e.target.value})} placeholder="e.g., Thick, Wavy" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Skin Type</label>
                  <input value={form.skin_type} onChange={e => setForm({...form, skin_type: e.target.value})} placeholder="e.g., Dry, Oily, Combination" />
                </div>
                <div className="form-group">
                  <label>Allergies</label>
                  <input value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Preferences</label>
                <textarea value={form.preferences} onChange={e => setForm({...form, preferences: e.target.value})} />
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
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Hair Type</th>
              <th>Skin Type</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} onClick={() => setSelected(c)}>
                <td><strong>{c.name}</strong></td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td>{c.hair_type || '-'}</td>
                <td>{c.skin_type || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && <div className="empty-state"><h3>No clients found</h3></div>}
      </div>
    </div>
  );
}

export default ClientsPage;
