import React, { useState } from 'react';
import api from '../services/api';
import AIOutput from '../components/AIOutput';

function CommissionOptimizationPage() {
  const [windowDays, setWindowDays] = useState(30);
  const [targetLift, setTargetLift] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setAiResult(null);
    try {
      const res = await api.post('/ai/commission-optimization', {
        window_days: Number(windowDays),
        target_revenue_lift_pct: targetLift === '' ? null : Number(targetLift),
      });
      const content = res.data?.optimization || res.data;
      setAiResult({ title: 'Commission Optimization', content });
    } catch (err) {
      if (err.response?.status === 503) {
        setError(err.response?.data?.error || 'AI is not configured.');
      } else {
        setError(err.response?.data?.error || 'AI request failed');
      }
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Commission Optimization</h1>
        <p>Recommend stylist commission adjustments to balance retention, motivation, and profitability.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Lookback window (days)</label>
              <input
                type="number"
                min="7"
                max="365"
                className="form-control"
                value={windowDays}
                onChange={(e) => setWindowDays(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Target revenue lift % (optional)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="form-control"
                value={targetLift}
                onChange={(e) => setTargetLift(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Optimizing...' : 'Generate Recommendations'}
          </button>
        </form>
      </div>

      {loading && <div className="loading">AI is analyzing performance data...</div>}
      {aiResult && <AIOutput title={aiResult.title} content={aiResult.content} />}
    </div>
  );
}

export default CommissionOptimizationPage;
