import React, { useState, useEffect } from 'react';
import { getBookings, aiReminderMessage } from '../services/api';

function ReminderMessagePage() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getBookings({ params: { limit: 50, status: 'confirmed' } })
      .then(r => setBookings(r.data?.data || r.data || []))
      .catch(() => {});
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setLoading(true);
    setError('');
    setReminder(null);
    try {
      const res = await aiReminderMessage({ booking_id: selectedBooking });
      setReminder(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate reminder');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    const text = reminder?.reminder?.sms_message || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const bookingList = Array.isArray(bookings) ? bookings : [];

  return (
    <div>
      <div className="page-header">
        <h1>SMS Reminder Generator</h1>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        AI generates personalized SMS appointment reminders based on client preferences and booking details.
      </p>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label>Select Upcoming Booking *</label>
            <select value={selectedBooking} onChange={e => setSelectedBooking(e.target.value)} required>
              <option value="">Choose a booking...</option>
              {bookingList.map(b => (
                <option key={b.id} value={b.id}>
                  {b.client_name} — {b.service_name} on {b.booking_date} at {b.start_time} (with {b.stylist_name})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-ai" disabled={loading || !selectedBooking}>
            {loading ? 'Generating reminder...' : 'Generate Personalized Reminder'}
          </button>
        </form>
      </div>

      {error && <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      {reminder && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Generated SMS Reminder</h3>
            <button onClick={handleCopy} className="btn btn-secondary" style={{ fontSize: '13px' }}>
              {copied ? '✓ Copied!' : 'Copy to Clipboard'}
            </button>
          </div>

          {/* Booking details */}
          {reminder.booking && (
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <strong>Client:</strong> {reminder.booking.client_name} |
              <strong> Service:</strong> {reminder.booking.service_name} |
              <strong> Date:</strong> {reminder.booking.booking_date} at {reminder.booking.start_time}
            </div>
          )}

          {/* SMS Message */}
          <div style={{
            background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '12px',
            padding: '20px', fontSize: '15px', lineHeight: '1.6', color: '#065f46',
            fontFamily: 'monospace'
          }}>
            {reminder.reminder?.sms_message || 'No message generated'}
          </div>

          {/* Metadata */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
            {reminder.reminder?.character_count && (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Characters: {reminder.reminder.character_count}
              </span>
            )}
            {reminder.reminder?.tone && (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Tone: {reminder.reminder.tone}
              </span>
            )}
            {reminder.reminder?.includes_cta && (
              <span style={{ fontSize: '12px', color: '#10b981' }}>
                ✓ Includes call-to-action
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReminderMessagePage;
