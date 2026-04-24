import React, { useState, useEffect } from 'react';
import api from '../services/api';

function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [revenueByService, setRevenueByService] = useState([]);
  const [topStylists, setTopStylists] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [clientRetention, setClientRetention] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/reports/summary'),
      api.get('/reports/revenue-by-service'),
      api.get('/reports/top-stylists'),
      api.get('/reports/popular-services'),
      api.get('/reports/client-retention')
    ]).then(([sum, rev, sty, pop, ret]) => {
      setSummary(sum.data);
      setRevenueByService(rev.data);
      setTopStylists(sty.data);
      setPopularServices(pop.data);
      setClientRetention(ret.data);
    });
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Reports & Analytics</h1>
      </div>

      {summary && (
        <div className="detail-view">
          <div className="detail-header">
            <h2>Summary</h2>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Total Clients</label><span>{summary.total_clients}</span></div>
            <div className="detail-field"><label>Total Bookings</label><span>{summary.total_bookings}</span></div>
            <div className="detail-field"><label>Total Revenue</label><span>${Number(summary.total_revenue).toLocaleString()}</span></div>
            <div className="detail-field"><label>Average Rating</label><span>{summary.avg_rating}</span></div>
          </div>
        </div>
      )}

      <div className="detail-view" style={{ marginTop: '24px' }}>
        <div className="detail-header">
          <h2>Revenue by Service</h2>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Total Bookings</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {revenueByService.map((r, i) => (
                <tr key={i}>
                  <td><strong>{r.service_name || 'Unknown'}</strong></td>
                  <td>{r.total_bookings}</td>
                  <td>${Number(r.total_revenue).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {revenueByService.length === 0 && <div className="empty-state"><h3>No data available</h3></div>}
        </div>
      </div>

      <div className="detail-view" style={{ marginTop: '24px' }}>
        <div className="detail-header">
          <h2>Top Stylists</h2>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Stylist</th>
                <th>Total Bookings</th>
                <th>Avg Rating</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topStylists.map((s, i) => (
                <tr key={i}>
                  <td><strong>{s.stylist_name || 'Unknown'}</strong></td>
                  <td>{s.total_bookings}</td>
                  <td>{s.avg_rating}</td>
                  <td>${Number(s.total_revenue).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {topStylists.length === 0 && <div className="empty-state"><h3>No data available</h3></div>}
        </div>
      </div>

      <div className="detail-view" style={{ marginTop: '24px' }}>
        <div className="detail-header">
          <h2>Popular Services</h2>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Times Booked</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {popularServices.map((p, i) => (
                <tr key={i}>
                  <td><strong>{p.service_name || 'Unknown'}</strong></td>
                  <td>{p.times_booked}</td>
                  <td>${Number(p.total_revenue).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {popularServices.length === 0 && <div className="empty-state"><h3>No data available</h3></div>}
        </div>
      </div>

      <div className="detail-view" style={{ marginTop: '24px' }}>
        <div className="detail-header">
          <h2>Client Retention</h2>
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Total Bookings</th>
                <th>First Booking</th>
                <th>Last Booking</th>
                <th>Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {clientRetention.map((c, i) => (
                <tr key={i}>
                  <td><strong>{c.client_name || 'Unknown'}</strong></td>
                  <td>{c.total_bookings}</td>
                  <td>{c.first_booking ? new Date(c.first_booking).toLocaleDateString() : '-'}</td>
                  <td>{c.last_booking ? new Date(c.last_booking).toLocaleDateString() : '-'}</td>
                  <td>${Number(c.total_spent).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {clientRetention.length === 0 && <div className="empty-state"><h3>No data available</h3></div>}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
