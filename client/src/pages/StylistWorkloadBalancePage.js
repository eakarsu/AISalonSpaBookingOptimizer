import React, { useState } from 'react';
import api from '../services/api';
import AIOutput from '../components/AIOutput';

function StylistWorkloadBalancePage() {
  const [windowDays, setWindowDays] = useState(14);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setAiResult(null);
    try {
      const res = await api.post('/ai/stylist-workload-balance', {
        window_days: Number(windowDays),
        notes,
      });
      const content = res.data?.analysis || res.data?.recommendation || res.data;
      setAiResult({ title: 'Stylist Workload Balance', content });
    } catch (err) {
      setError(err.response?.data?.error || 'AI request failed');
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Stylist Workload Balance</h1>
        <p>Identify overloaded vs underutilized stylists, with rebalance actions.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Window (days)</label>
              <input
                type="number"
                min="1"
                max="60"
                className="form-control"
                value={windowDays}
                onChange={(e) => setWindowDays(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Additional notes (optional)</label>
            <textarea
              className="form-control"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="PTO, new hires, training periods, recent promotions..."
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Balancing...' : 'Analyze Workload'}
          </button>
        </form>
      </div>

      {loading && <div className="loading">AI is analyzing stylist workloads...</div>}
      {aiResult && <AIOutput title={aiResult.title} content={aiResult.content} />}
    </div>
  );
}

export default StylistWorkloadBalancePage;
