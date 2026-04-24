import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const getSchedules = () => api.get('/schedules');
const createSchedule = (data) => api.post('/schedules', data);
const updateSchedule = (id, data) => api.put(`/schedules/${id}`, data);
const deleteSchedule = (id) => api.delete(`/schedules/${id}`);
const getStylists = () => api.get('/stylists');

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function SchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ stylist_id: '', day_of_week: 'Monday', start_time: '', end_time: '', break_start: '', break_end: '', is_available: true, notes: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [schedRes, stylistRes] = await Promise.all([getSchedules(), getStylists()]);
    setSchedules(schedRes.data);
    setStylists(stylistRes.data);
  };

  const resetForm = () => {
    setForm({ stylist_id: '', day_of_week: 'Monday', start_time: '', end_time: '', break_start: '', break_end: '', is_available: true, notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateSchedule(editing.id, form);
    } else {
      await createSchedule(form);
    }
    resetForm();
    loadData();
    setSelected(null);
  };

  const handleEdit = (item) => {
    setForm({
      stylist_id: item.stylist_id || '', day_of_week: item.day_of_week || 'Monday',
      start_time: item.start_time || '', end_time: item.end_time || '',
      break_start: item.break_start || '', break_end: item.break_end || '',
      is_available: item.is_available !== false, notes: item.notes || ''
    });
    setEditing(item);
    setShowForm(true);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      await deleteSchedule(id);
      loadData();
      setSelected(null);
    }
  };

  const getStylistName = (stylistId) => {
    const stylist = stylists.find(s => s.id === stylistId);
    return stylist ? stylist.name : 'Unknown';
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time.substring(0, 5);
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Schedule Details</h1>
          <button className="btn btn-secondary" onClick={() => setSelected(null)}>Back to List</button>
        </div>
        <div className="detail-view">
          <div className="detail-header">
            <h2>{selected.stylist_name || getStylistName(selected.stylist_id)} - {selected.day_of_week}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Stylist</label><span>{selected.stylist_name || getStylistName(selected.stylist_id)}</span></div>
            <div className="detail-field"><label>Day of Week</label><span>{selected.day_of_week}</span></div>
            <div className="detail-field"><label>Start Time</label><span>{formatTime(selected.start_time)}</span></div>
            <div className="detail-field"><label>End Time</label><span>{formatTime(selected.end_time)}</span></div>
            <div className="detail-field"><label>Break Start</label><span>{formatTime(selected.break_start)}</span></div>
            <div className="detail-field"><label>Break End</label><span>{formatTime(selected.break_end)}</span></div>
            <div className="detail-field"><label>Availability</label><span><span className={`badge ${selected.is_available ? 'badge-success' : 'badge-danger'}`}>{selected.is_available ? 'Available' : 'Unavailable'}</span></span></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Notes</label><span>{selected.notes || 'N/A'}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Staff Schedules</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ New Schedule</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal">
            <h2>{editing ? 'Edit Schedule' : 'New Schedule'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Stylist *</label>
                  <select value={form.stylist_id} onChange={e => setForm({...form, stylist_id: e.target.value})} required>
                    <option value="">Select Stylist</option>
                    {stylists.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Day of Week *</label>
                  <select value={form.day_of_week} onChange={e => setForm({...form, day_of_week: e.target.value})} required>
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Break Start</label>
                  <input type="time" value={form.break_start} onChange={e => setForm({...form, break_start: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Break End</label>
                  <input type="time" value={form.break_end} onChange={e => setForm({...form, break_end: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={form.is_available} onChange={e => setForm({...form, is_available: e.target.checked})} style={{ marginRight: '8px' }} />
                  Available
                </label>
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
              <th>Stylist</th>
              <th>Day</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Break</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(s => (
              <tr key={s.id} onClick={() => setSelected(s)}>
                <td><strong>{s.stylist_name || getStylistName(s.stylist_id)}</strong></td>
                <td>{s.day_of_week}</td>
                <td>{formatTime(s.start_time)}</td>
                <td>{formatTime(s.end_time)}</td>
                <td>{s.break_start ? `${formatTime(s.break_start)} - ${formatTime(s.break_end)}` : 'None'}</td>
                <td><span className={`badge ${s.is_available ? 'badge-success' : 'badge-danger'}`}>{s.is_available ? 'Available' : 'Unavailable'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {schedules.length === 0 && <div className="empty-state"><h3>No schedules found</h3><p>Add your first staff schedule to get started.</p></div>}
      </div>
    </div>
  );
}

export default SchedulesPage;
