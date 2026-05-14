import React, { useState } from 'react';
import api from '../services/api';
import AIOutput from '../components/AIOutput';

function AppointmentConflictPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [includeResolutions, setIncludeResolutions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setAiResult(null);
    try {
      const res = await api.post('/ai/appointment-conflict-detection', {
        date,
        buffer_minutes: Number(bufferMinutes),
        include_resolutions: includeResolutions,
      });
      const content = res.data?.analysis || res.data?.recommendation || res.data;
      setAiResult({ title: 'Appointment Conflicts', content });
    } catch (err) {
      setError(err.response?.data?.error || 'AI request failed');
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Appointment Conflict Detection</h1>
        <p>Detect overbooking, missing buffers, and double-bookings — with suggested resolutions.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Buffer (minutes)</label>
              <input
                type="number"
                min="0"
                max="120"
                className="form-control"
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Include resolutions?</label>
              <select
                className="form-control"
                value={String(includeResolutions)}
                onChange={(e) => setIncludeResolutions(e.target.value === 'true')}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Detecting...' : 'Detect Conflicts'}
          </button>
        </form>
      </div>

      {loading && <div className="loading">AI is analyzing the schedule...</div>}
      {aiResult && <AIOutput title={aiResult.title} content={aiResult.content} />}
    </div>
  );
}

export default AppointmentConflictPage;
