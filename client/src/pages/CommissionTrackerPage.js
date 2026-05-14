import React, { useState, useEffect } from 'react';
import { getStylists, getStylistCommissions } from '../services/api';

function CommissionTrackerPage() {
  const [stylists, setStylists] = useState([]);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState('0.00');
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryData, setSummaryData] = useState({});

  useEffect(() => {
    getStylists().then(r => {
      const list = r.data || [];
      setStylists(list);
    });
  }, []);

  useEffect(() => {
    if (!selectedStylist) return;
    setLoading(true);
    getStylistCommissions(selectedStylist.id, { page, limit: 20 })
      .then(r => {
        setCommissions(r.data?.data || []);
        setTotalEarnings(r.data?.total_earnings || '0.00');
        setPagination(r.data?.pagination || {});
      })
      .catch(() => setCommissions([]))
      .finally(() => setLoading(false));
  }, [selectedStylist, page]);

  const loadAllSummaries = async () => {
    setLoadingSummary(true);
    const result = {};
    for (const s of stylists) {
      try {
        const r = await getStylistCommissions(s.id, { limit: 1 });
        result[s.id] = r.data?.total_earnings || '0.00';
      } catch (_) {
        result[s.id] = '0.00';
      }
    }
    setSummaryData(result);
    setLoadingSummary(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Commission Tracker</h1>
        <button className="btn btn-secondary" onClick={loadAllSummaries} disabled={loadingSummary}>
          {loadingSummary ? 'Loading...' : 'Load All Summaries'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        {/* Stylist List */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Stylists</h3>
          {stylists.map(s => (
            <div
              key={s.id}
              onClick={() => { setSelectedStylist(s); setPage(1); }}
              style={{
                padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '6px',
                background: selectedStylist?.id === s.id ? 'var(--bg-card-hover)' : 'transparent',
                border: selectedStylist?.id === s.id ? '1px solid var(--accent)' : '1px solid transparent',
              }}
            >
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{s.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                ★ {s.rating || 'N/A'} | Rate: {s.hourly_rate ? `$${s.hourly_rate}/hr` : 'N/A'}
              </div>
              {summaryData[s.id] !== undefined && (
                <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '600', marginTop: '4px' }}>
                  Total: ${summaryData[s.id]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Commission Details */}
        <div>
          {!selectedStylist ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Select a stylist to view commissions
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '8px' }}>{selectedStylist.name} — Commission Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>${totalEarnings}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Earnings</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>{pagination.total || 0}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Bookings</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(139,92,246,0.1)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>40%</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Commission Rate</div>
                  </div>
                </div>
              </div>

              {/* Commission Table */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: '600' }}>
                  Commission History
                </div>
                {loading ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
                ) : commissions.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No commission records found</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg)' }}>
                        {['Date', 'Service', 'Client', 'Booking Total', 'Commission'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map(c => (
                        <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 16px', fontSize: '13px' }}>{c.booking_date || '—'}</td>
                          <td style={{ padding: '10px 16px', fontSize: '13px' }}>{c.service_name || '—'}</td>
                          <td style={{ padding: '10px 16px', fontSize: '13px' }}>{c.client_name || '—'}</td>
                          <td style={{ padding: '10px 16px', fontSize: '13px' }}>${parseFloat(c.total_price || 0).toFixed(2)}</td>
                          <td style={{ padding: '10px 16px', fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                            ${parseFloat(c.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div style={{ padding: '12px 16px', display: 'flex', gap: '8px', borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
                    <span style={{ padding: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>Next</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommissionTrackerPage;
