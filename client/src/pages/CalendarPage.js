import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

const COLORS = ['#8B5CF6','#EC4899','#06B6D4','#10B981','#F59E0B','#EF4444','#3B82F6','#D946EF','#14B8A6','#F97316'];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const HOURS = Array.from({length: 13}, (_, i) => i + 8); // 8am to 8pm

function CalendarPage() {
  const [bookings, setBookings] = useState([]);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); d.setHours(0,0,0,0); return d;
  });
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { const r = await api.get('/bookings'); setBookings(r.data); };

  const getWeekDates = () => DAYS.map((_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });

  const formatDate = (d) => `${d.getMonth()+1}/${d.getDate()}`;
  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };

  const getBookingsForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.booking_date && b.booking_date.split('T')[0] === dateStr);
  };

  const getTopOffset = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return ((h - 8) * 60 + m);
  };

  const getDuration = (start, end) => {
    if (!start || !end) return 60;
    const [h1,m1] = start.split(':').map(Number);
    const [h2,m2] = end.split(':').map(Number);
    return (h2*60+m2) - (h1*60+m1);
  };

  const weekDates = getWeekDates();

  return (
    <div>
      <div className="page-header">
        <h1>Appointments Calendar</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={prevWeek}>Previous Week</button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={nextWeek}>Next Week</button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ padding: '12px 8px', background: 'var(--bg-input)', fontSize: '0.75rem', color: 'var(--text-muted)' }}></div>
          {weekDates.map((d, i) => (
            <div key={i} style={{ padding: '12px 8px', background: 'var(--bg-input)', textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{DAYS[i].slice(0,3)}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{d.getDate()}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', position: 'relative' }}>
          <div>
            {HOURS.map(h => (
              <div key={h} style={{ height: '60px', borderBottom: '1px solid var(--border)', padding: '4px 8px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {h > 12 ? `${h-12}PM` : h === 12 ? '12PM' : `${h}AM`}
              </div>
            ))}
          </div>
          {weekDates.map((date, di) => {
            const dayBookings = getBookingsForDay(date);
            return (
              <div key={di} style={{ position: 'relative', borderLeft: '1px solid var(--border)' }}>
                {HOURS.map(h => (
                  <div key={h} style={{ height: '60px', borderBottom: '1px solid var(--border)' }}></div>
                ))}
                {dayBookings.map((b, bi) => {
                  const top = getTopOffset(b.start_time);
                  const height = Math.max(getDuration(b.start_time, b.end_time), 30);
                  const color = COLORS[b.stylist_id % COLORS.length];
                  return (
                    <div key={b.id} onClick={(e) => { e.stopPropagation(); setSelected(b); }}
                      style={{
                        position: 'absolute', top: `${top}px`, left: '2px', right: '2px', height: `${height}px`,
                        background: `${color}30`, border: `1px solid ${color}`, borderLeft: `3px solid ${color}`,
                        borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', overflow: 'hidden',
                        fontSize: '0.7rem', lineHeight: '1.3', zIndex: 1, transition: 'all 0.2s'
                      }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{b.start_time?.slice(0,5)}</div>
                      <div style={{ color }}>{b.client_name}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{b.service_name}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Booking Details</h2>
            <div className="detail-grid">
              <div className="detail-field"><label>Client</label><span>{selected.client_name}</span></div>
              <div className="detail-field"><label>Stylist</label><span>{selected.stylist_name}</span></div>
              <div className="detail-field"><label>Service</label><span>{selected.service_name}</span></div>
              <div className="detail-field"><label>Date</label><span>{selected.booking_date ? new Date(selected.booking_date).toLocaleDateString() : '-'}</span></div>
              <div className="detail-field"><label>Time</label><span>{selected.start_time?.slice(0,5)} - {selected.end_time?.slice(0,5)}</span></div>
              <div className="detail-field"><label>Status</label><span className={`badge badge-${selected.status}`}>{selected.status}</span></div>
              <div className="detail-field"><label>Price</label><span>${selected.total_price}</span></div>
              <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Notes</label><span>{selected.notes || 'N/A'}</span></div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
