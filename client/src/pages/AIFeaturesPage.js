import React, { useState, useEffect } from 'react';
import { getClients, getServices, getStylists, aiStylistMatch, aiDurationPredict, aiProductRecommend, aiRebookSuggest, aiWaitlistOptimize } from '../services/api';
import AIOutput from '../components/AIOutput';

function AIFeaturesPage() {
  const [activeFeature, setActiveFeature] = useState(null);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');

  // Form states
  const [matchForm, setMatchForm] = useState({ client_id: '', service_id: '' });
  const [durationForm, setDurationForm] = useState({ client_id: '', service_id: '', stylist_id: '' });
  const [productForm, setProductForm] = useState({ client_id: '', service_id: '' });
  const [rebookForm, setRebookForm] = useState({ client_id: '' });

  useEffect(() => {
    Promise.all([getClients(), getServices(), getStylists()]).then(([c, s, st]) => {
      setClients(c.data);
      setServices(s.data);
      setStylists(st.data);
    });
  }, []);

  const features = [
    {
      id: 'stylist-match',
      title: 'AI Stylist Matching',
      desc: 'Match clients with the best stylist based on specialties, preferences, hair/skin type, and service requirements.',
      icon: '&#x1F916;',
      gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
    },
    {
      id: 'duration-predict',
      title: 'Service Duration Prediction',
      desc: 'Predict accurate service duration considering client hair type, service complexity, and stylist experience.',
      icon: '&#x23F1;',
      gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)'
    },
    {
      id: 'product-recommend',
      title: 'Product Recommendation',
      desc: 'Get personalized product recommendations based on client profile, allergies, and recent services.',
      icon: '&#x1F48E;',
      gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)'
    },
    {
      id: 'rebook-suggest',
      title: 'Rebooking Automation',
      desc: 'AI-powered rebooking suggestions based on service history and optimal maintenance intervals.',
      icon: '&#x1F504;',
      gradient: 'linear-gradient(135deg, #10B981, #059669)'
    },
    {
      id: 'waitlist-optimize',
      title: 'Waitlist Optimizer',
      desc: 'Intelligently prioritize and manage the waitlist by matching availability with client urgency.',
      icon: '&#x1F4CA;',
      gradient: 'linear-gradient(135deg, #F59E0B, #D97706)'
    },
  ];

  const handleStylistMatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAiResult(null);
    try {
      const res = await aiStylistMatch(matchForm);
      setAiResult({ title: 'Stylist Match Results', content: res.data.recommendation });
    } catch (err) {
      setError(err.response?.data?.error || 'AI request failed');
    }
    setLoading(false);
  };

  const handleDurationPredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAiResult(null);
    try {
      const res = await aiDurationPredict(durationForm);
      setAiResult({ title: 'Duration Prediction', content: res.data.prediction });
    } catch (err) {
      setError(err.response?.data?.error || 'AI request failed');
    }
    setLoading(false);
  };

  const handleProductRecommend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAiResult(null);
    try {
      const res = await aiProductRecommend(productForm);
      setAiResult({ title: 'Product Recommendations', content: res.data.recommendations });
    } catch (err) {
      setError(err.response?.data?.error || 'AI request failed');
    }
    setLoading(false);
  };

  const handleRebookSuggest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAiResult(null);
    try {
      const res = await aiRebookSuggest(rebookForm);
      setAiResult({ title: 'Rebooking Suggestions', content: res.data.suggestions });
    } catch (err) {
      setError(err.response?.data?.error || 'AI request failed');
    }
    setLoading(false);
  };

  const handleWaitlistOptimize = async () => {
    setLoading(true);
    setError('');
    setAiResult(null);
    try {
      const res = await aiWaitlistOptimize();
      setAiResult({ title: 'Waitlist Optimization', content: res.data.optimization });
    } catch (err) {
      setError(err.response?.data?.error || 'AI request failed');
    }
    setLoading(false);
  };

  if (!activeFeature) {
    return (
      <div>
        <div className="page-header">
          <h1>AI Features</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Powered by OpenRouter AI. Select a feature to get intelligent insights for your salon.
        </p>
        <div className="ai-feature-grid">
          {features.map(f => (
            <div key={f.id} className="ai-feature-card" onClick={() => { setActiveFeature(f.id); setAiResult(null); setError(''); }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }} dangerouslySetInnerHTML={{ __html: f.icon }} />
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderFeatureForm = () => {
    switch (activeFeature) {
      case 'stylist-match':
        return (
          <form onSubmit={handleStylistMatch}>
            <div className="form-row">
              <div className="form-group">
                <label>Select Client *</label>
                <select value={matchForm.client_id} onChange={e => setMatchForm({...matchForm, client_id: e.target.value})} required>
                  <option value="">Choose client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.hair_type || 'N/A'}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Select Service *</label>
                <select value={matchForm.service_id} onChange={e => setMatchForm({...matchForm, service_id: e.target.value})} required>
                  <option value="">Choose service...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? 'Analyzing...' : 'Find Best Stylist Match'}
            </button>
          </form>
        );

      case 'duration-predict':
        return (
          <form onSubmit={handleDurationPredict}>
            <div className="form-row">
              <div className="form-group">
                <label>Select Client *</label>
                <select value={durationForm.client_id} onChange={e => setDurationForm({...durationForm, client_id: e.target.value})} required>
                  <option value="">Choose client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Select Service *</label>
                <select value={durationForm.service_id} onChange={e => setDurationForm({...durationForm, service_id: e.target.value})} required>
                  <option value="">Choose service...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.base_duration_min}min base)</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Select Stylist (optional)</label>
              <select value={durationForm.stylist_id} onChange={e => setDurationForm({...durationForm, stylist_id: e.target.value})}>
                <option value="">Any stylist...</option>
                {stylists.map(s => <option key={s.id} value={s.id}>{s.name} - {s.experience_years}yr exp</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? 'Predicting...' : 'Predict Service Duration'}
            </button>
          </form>
        );

      case 'product-recommend':
        return (
          <form onSubmit={handleProductRecommend}>
            <div className="form-row">
              <div className="form-group">
                <label>Select Client *</label>
                <select value={productForm.client_id} onChange={e => setProductForm({...productForm, client_id: e.target.value})} required>
                  <option value="">Choose client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.hair_type || 'N/A'}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Recent/Planned Service (optional)</label>
                <select value={productForm.service_id} onChange={e => setProductForm({...productForm, service_id: e.target.value})}>
                  <option value="">No specific service...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? 'Recommending...' : 'Get Product Recommendations'}
            </button>
          </form>
        );

      case 'rebook-suggest':
        return (
          <form onSubmit={handleRebookSuggest}>
            <div className="form-group">
              <label>Select Client *</label>
              <select value={rebookForm.client_id} onChange={e => setRebookForm({...rebookForm, client_id: e.target.value})} required>
                <option value="">Choose client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? 'Analyzing history...' : 'Generate Rebooking Suggestions'}
            </button>
          </form>
        );

      case 'waitlist-optimize':
        return (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Analyze the current waitlist and optimize scheduling by matching client needs with stylist availability.
            </p>
            <button className="btn btn-ai" onClick={handleWaitlistOptimize} disabled={loading}>
              {loading ? 'Optimizing...' : 'Optimize Waitlist Now'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const currentFeature = features.find(f => f.id === activeFeature);

  return (
    <div>
      <div className="page-header">
        <h1>{currentFeature?.title}</h1>
        <button className="btn btn-secondary" onClick={() => { setActiveFeature(null); setAiResult(null); setError(''); }}>
          Back to AI Features
        </button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px', marginBottom: '20px' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{currentFeature?.desc}</p>
        {renderFeatureForm()}
      </div>

      {error && <div className="error-msg">{error}</div>}

      <AIOutput title={aiResult?.title} content={aiResult?.content} loading={loading} />
    </div>
  );
}

export default AIFeaturesPage;
