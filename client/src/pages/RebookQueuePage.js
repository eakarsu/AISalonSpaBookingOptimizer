import React, { useState } from 'react';
import { aiRebookQueue, createBookingFromRecommendation } from '../services/api';

function RebookQueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookingId, setBookingId] = useState(null);

  const loadQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await aiRebookQueue();
      setQueue(res.data?.rebook_queue || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load rebook queue');
    }
    setLoading(false);
  };

  const createBooking = async (item) => {
    setSuccess('');
    try {
      const res = await createBookingFromRecommendation({
        client_id: item.client?.id,
        recommendation: item,
      });
      setBookingId(res.data?.booking?.id);
      setSuccess(`Booking created for ${item.client?.name}! Booking ID: ${res.data?.booking?.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking');
    }
  };

  const priorityColor = (p) => ({ urgent: '#ef4444', normal: '#3b82f6', low: '#6b7280' }[p] || '#3b82f6');
  const priorityBg = (p) => ({ urgent: 'rgba(239,68,68,0.1)', normal: 'rgba(59,130,246,0.1)', low: 'rgba(107,114,128,0.1)' }[p] || 'rgba(59,130,246,0.1)');

  return (
    <div>
      <div className="page-header">
        <h1>Rebook Queue</h1>
        <button className="btn btn-ai" onClick={loadQueue} disabled={loading}>
          {loading ? 'Analyzing clients...' : 'Run AI Rebook Analysis'}
        </button>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        AI identifies clients who haven't booked in 30+ days and generates personalized outreach messages.
      </p>

      {error && <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ background: '#d1fae5', border: '1px solid #10b981', color: '#065f46', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>{success}</div>}

      {queue.length === 0 && !loading && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔄</div>
          <p>Click "Run AI Rebook Analysis" to find clients who need rebooking outreach.</p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🤖</div>
          <p>AI is analyzing client booking history...</p>
        </div>
      )}

      {queue.length > 0 && (
        <>
          <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Found <strong style={{ color: 'var(--text-primary)' }}>{queue.length}</strong> clients needing rebook outreach
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {queue.map((item, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{item.client?.name}</h3>
                      <span style={{
                        padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                        background: priorityBg(item.priority), color: priorityColor(item.priority),
                        textTransform: 'uppercase'
                      }}>
                        {item.priority || 'normal'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Last booking: {item.client?.last_booking_date || 'Never'} |
                      Hair: {item.client?.hair_type || 'N/A'} |
                      Skin: {item.client?.skin_type || 'N/A'}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => createBooking(item)}
                    style={{ fontSize: '13px' }}
                  >
                    Book Now
                  </button>
                </div>

                {item.suggested_service && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Suggested: </span>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{item.suggested_service}</span>
                  </div>
                )}

                {item.outreach_message && (
                  <div style={{
                    background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: '8px', padding: '12px', fontSize: '13px', color: 'var(--text-secondary)',
                    fontStyle: 'italic'
                  }}>
                    "{item.outreach_message}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default RebookQueuePage;
