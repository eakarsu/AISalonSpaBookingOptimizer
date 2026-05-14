import React, { useState } from 'react';
import api from '../services/api';
import AIOutput from '../components/AIOutput';

function ServiceDemandForecastPage() {
  const [days, setDays] = useState(14);
  const [includeStaffing, setIncludeStaffing] = useState(true);
  const [eventsContext, setEventsContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setAiResult(null);
    try {
      const res = await api.post('/ai/service-demand-forecast', {
        days: Number(days),
        include_staffing_recs: includeStaffing,
        events_context: eventsContext,
      });
      const content = res.data?.forecast || res.data?.recommendation || res.data;
      setAiResult({ title: 'Service Demand Forecast', content });
    } catch (err) {
      setError(err.response?.data?.error || 'AI request failed');
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Service Demand Forecast</h1>
        <p>N-day demand by service with peak/soft periods plus staffing and promo recommendations.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Forecast horizon (days)</label>
              <input
                type="number"
                min="1"
                max="120"
                className="form-control"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Include staffing recs?</label>
              <select
                className="form-control"
                value={String(includeStaffing)}
                onChange={(e) => setIncludeStaffing(e.target.value === 'true')}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Local events / promotions context (optional)</label>
            <textarea
              className="form-control"
              rows={3}
              value={eventsContext}
              onChange={(e) => setEventsContext(e.target.value)}
              placeholder="e.g. wedding season, school break starts on..."
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Forecasting...' : 'Generate Forecast'}
          </button>
        </form>
      </div>

      {loading && <div className="loading">AI is analyzing booking data...</div>}
      {aiResult && <AIOutput title={aiResult.title} content={aiResult.content} />}
    </div>
  );
}

export default ServiceDemandForecastPage;
