import React, { useState, useEffect } from 'react';
import { getWaitlist, getClients, getStylists, getServices, createWaitlistEntry, updateWaitlistEntry, deleteWaitlistEntry } from '../services/api';

function WaitlistPage() {
  const [waitlist, setWaitlist] = useState([]);
  const [clients, setClients] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ client_id: '', service_id: '', preferred_stylist_id: '', preferred_date: '', preferred_time: '', priority: 'medium', notes: '', status: 'waiting' });

  useEffect(() => {
    loadData();
    Promise.all([getClients(), getStylists(), getServices()]).then(([c, s, sv]) => {
      setClients(c.data);
      setStylists(s.data);
      setServices(sv.data);
    });
  }, []);

  const loadData = async () => {
    const res = await getWaitlist();
    setWaitlist(res.data);
  };

  const resetForm = () => {
    setForm({ client_id: '', service_id: '', preferred_stylist_id: '', preferred_date: '', preferred_time: '', priority: 'medium', notes: '', status: 'waiting' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateWaitlistEntry(editing.id, form);
    } else {
      await createWaitlistEntry(form);
    }
    resetForm();
    loadData();
    setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({
      client_id: item.client_id || '', service_id: item.service_id || '',
      preferred_stylist_id: item.preferred_stylist_id || '',
      preferred_date: item.preferred_date ? item.preferred_date.split('T')[0] : '',
      preferred_time: item.preferred_time || '', priority: item.priority || 'medium',
      notes: item.notes || '', status: item.status || 'waiting'
    });
    setEditing(item);
    setShowForm(true);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove from waitlist?')) {
      await deleteWaitlistEntry(id);
      loadData();
      setSelected(null);
    }
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Waitlist Entry Details</h1>
          <button className="btn btn-secondary" onClick={() => setSelected(null)}>Back to List</button>
        </div>
        <div className="detail-view">
          <div className="detail-header">
            <h2>Waitlist #{selected.id}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Client</label><span>{selected.client_name || 'N/A'}</span></div>
            <div className="detail-field"><label>Service</label><span>{selected.service_name || 'N/A'}</span></div>
            <div className="detail-field"><label>Preferred Date</label><span>{selected.preferred_date ? new Date(selected.preferred_date).toLocaleDateString() : 'Flexible'}</span></div>
            <div className="detail-field"><label>Preferred Time</label><span>{selected.preferred_time || 'Any'}</span></div>
            <div className="detail-field"><label>Priority</label><span className={`badge badge-${selected.priority}`}>{selected.priority}</span></div>
            <div className="detail-field"><label>Status</label><span className={`badge badge-${selected.status}`}>{selected.status}</span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Notes</label><span>{selected.notes || 'N/A'}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Waitlist</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Add to Waitlist</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Waitlist Entry' : 'Add to Waitlist'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Client *</label>
                  <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required>
                    <option value="">Select client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Service *</label>
                  <select value={form.service_id} onChange={e => setForm({...form, service_id: e.target.value})} required>
                    <option value="">Select service...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Preferred Stylist</label>
                <select value={form.preferred_stylist_id} onChange={e => setForm({...form, preferred_stylist_id: e.target.value})}>
                  <option value="">Any available</option>
                  {stylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Preferred Date</label>
                  <input type="date" value={form.preferred_date} onChange={e => setForm({...form, preferred_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Preferred Time</label>
                  <input type="time" value={form.preferred_time} onChange={e => setForm({...form, preferred_time: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="waiting">Waiting</option>
                    <option value="contacted">Contacted</option>
                    <option value="booked">Booked</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Service</th>
              <th>Preferred Date</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {waitlist.map(w => (
              <tr key={w.id} onClick={() => setSelected(w)}>
                <td><strong>{w.client_name || '-'}</strong></td>
                <td>{w.service_name || '-'}</td>
                <td>{w.preferred_date ? new Date(w.preferred_date).toLocaleDateString() : 'Flexible'}</td>
                <td><span className={`badge badge-${w.priority}`}>{w.priority}</span></td>
                <td><span className={`badge badge-${w.status}`}>{w.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {waitlist.length === 0 && <div className="empty-state"><h3>Waitlist is empty</h3></div>}
      </div>
    </div>
  );
}

export default WaitlistPage;
