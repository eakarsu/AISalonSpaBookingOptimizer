import React, { useState } from 'react';
import api from '../services/api';
import AIOutput from '../components/AIOutput';

function RetailRecommendPage() {
  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setAiResult(null);
    try {
      const payload = { top_k: Number(topK) };
      if (clientId) payload.client_id = Number(clientId);
      if (serviceId) payload.service_id = Number(serviceId);
      if (bookingId) payload.booking_id = Number(bookingId);
      const res = await api.post('/ai/retail-recommend', payload);
      const content = res.data?.recommendations || res.data;
      setAiResult({ title: 'Retail Product Recommendations', content });
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
        <h1>Retail Product Recommend</h1>
        <p>Suggest products that complement the booked service and the client profile, with stylist pitch lines.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Client ID (optional)</label>
              <input
                type="number"
                className="form-control"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Service ID (optional)</label>
              <input
                type="number"
                className="form-control"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Booking ID (optional)</label>
              <input
                type="number"
                className="form-control"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Top K</label>
              <input
                type="number"
                min="1"
                max="20"
                className="form-control"
                value={topK}
                onChange={(e) => setTopK(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Recommending...' : 'Get Recommendations'}
          </button>
        </form>
      </div>

      {loading && <div className="loading">AI is matching products to client and service...</div>}
      {aiResult && <AIOutput title={aiResult.title} content={aiResult.content} />}
    </div>
  );
}

export default RetailRecommendPage;
