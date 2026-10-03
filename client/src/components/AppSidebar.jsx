import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './AppSidebar.css';

const LINKS = [
  { to: '/insights/timeline', label: 'Timeline View', group: 'Insights' },
  { to: '/codex/custom-viz', label: 'Custom Viz', group: 'Insights' },
  { to: '/codex/operations', label: 'Operations', group: 'Insights' },
  { to: '/', label: 'Dashboard', group: 'Workspace' },
  { to: '/stylists', label: 'Stylists', group: 'Workspace' },
  { to: '/services', label: 'Services', group: 'Workspace' },
  { to: '/clients', label: 'Clients', group: 'Workspace' },
  { to: '/bookings', label: 'Bookings', group: 'Workspace' },
  { to: '/products', label: 'Products', group: 'Workspace' },
  { to: '/waitlist', label: 'Waitlist', group: 'Workspace' },
  { to: '/ai', label: 'AI Features', group: 'Workspace' },
  { to: '/schedules', label: 'Schedules', group: 'Workspace' },
  { to: '/reviews', label: 'Reviews', group: 'Workspace' },
  { to: '/promotions', label: 'Promotions', group: 'Workspace' },
  { to: '/inventory', label: 'Inventory', group: 'Workspace' },
  { to: '/loyalty', label: 'Loyalty', group: 'Workspace' },
  { to: '/reports', label: 'Reports', group: 'Workspace' },
  { to: '/giftcards', label: 'Gift Cards', group: 'Workspace' },
  { to: '/expenses', label: 'Expenses', group: 'Workspace' },
  { to: '/communications', label: 'Communications', group: 'Workspace' },
  { to: '/performance', label: 'Performance', group: 'Workspace' },
  { to: '/calendar', label: 'Calendar', group: 'Workspace' },
  { to: '/tips', label: 'Tips', group: 'Workspace' },
  { to: '/checkin', label: 'Checkin', group: 'Workspace' },
  { to: '/memberships', label: 'Memberships', group: 'Workspace' },
  { to: '/suppliers', label: 'Suppliers', group: 'Workspace' },
  { to: '/payroll', label: 'Payroll', group: 'Workspace' },
  { to: '/booking-calendar', label: 'Booking Calendar', group: 'Workspace' },
  { to: '/commissions', label: 'Commission Tracker', group: 'Workspace' },
  { to: '/rebook-queue', label: 'Rebook Queue', group: 'Workspace' },
  { to: '/reminders', label: 'Reminder Message', group: 'Workspace' },
  { to: '/ai/service-demand-forecast', label: 'Service Demand Forecast', group: 'AI tools' },
  { to: '/ai/stylist-workload-balance', label: 'Stylist Workload Balance', group: 'AI tools' },
  { to: '/ai/appointment-conflict-detection', label: 'Appointment Conflict', group: 'AI tools' },
  { to: '/ai/commission-optimization', label: 'Commission Optimization', group: 'AI tools' },
  { to: '/ai/retail-recommend', label: 'Retail Recommend', group: 'AI tools' },
  { to: '/cf-smart-service-bundling', label: 'Cf Smart Service Bundling', group: 'Workspace' },
  { to: '/cf-stylist-skill-tagging-matching', label: 'Cf Stylist Skill Tagging Matching', group: 'Workspace' },
  { to: '/cf-dynamic-service-pricing', label: 'Cf Dynamic Service Pricing', group: 'Workspace' },
  { to: '/cf-client-lifetime-value-scoring', label: 'Cf Client Lifetime Value Scoring', group: 'Workspace' },
  { to: '/cf-inventory-management-automation', label: 'Cf Inventory Management Automation', group: 'Workspace' },
  { to: '/cf-waitlist-fulfillment-ai', label: 'Cf Waitlist Fulfillment Ai', group: 'Workspace' },
  { to: '/gap-no-servicedemandforecast-busytime-prediction', label: 'Gap No Servicedemandforecast Busytime Prediction', group: 'Workspace' },
  { to: '/gap-no-stylistworkloadbalance', label: 'Gap No Stylistworkloadbalance', group: 'Workspace' },
  { to: '/gap-no-commissionoptimization', label: 'Gap No Commissionoptimization', group: 'Workspace' },
  { to: '/gap-no-retailrecommend-product-to-add-to-service', label: 'Gap No Retailrecommend Product To Add To Service', group: 'Workspace' },
  { to: '/gap-no-appointmentconflictdetection', label: 'Gap No Appointmentconflictdetection', group: 'Workspace' },
  { to: '/gap-no-noshow-prediction', label: 'Gap No Noshow Prediction', group: 'Workspace' },
  { to: '/gap-no-public-online-booking-widget-api', label: 'Gap No Public Online Booking Widget Api', group: 'Workspace' },
  { to: '/gap-no-automated-reminder-smsemail-communication', label: 'Gap No Automated Reminder Smsemail Communication', group: 'Workspace' },
  { to: '/gap-no-supplier-reorder-automation', label: 'Gap No Supplier Reorder Automation', group: 'Workspace' },
  { to: '/gap-no-staff-absence-coverage-planning', label: 'Gap No Staff Absence Coverage Planning', group: 'Workspace' },
  { to: '/gap-no-payment-processor-integration', label: 'Gap No Payment Processor Integration', group: 'Workspace' },
  { to: '/gap-no-pos-hardware-integration', label: 'Gap No Pos Hardware Integration', group: 'Workspace' },
];

export default function AppSidebar() {
  const [query, setQuery] = useState('');
  const visible = LINKS.filter(link => link.label.toLowerCase().includes(query.toLowerCase().trim()));
  return <aside className="codex-side" aria-label="Application navigation">
    <div className="codex-side-brand"><strong>AISalon Spa Booking Optimizer</strong><span>Workspace</span></div>
    <label className="codex-side-search-label" htmlFor="codex-side-search">Find a section</label>
    <input id="codex-side-search" className="codex-side-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search navigation" />
    <nav className="codex-side-links" aria-label="Sections">
      {['Workspace', 'AI tools', 'Insights'].map(group => {
        const items = visible.filter(link => link.group === group);
        return items.length ? <div className="codex-side-group" key={group}>
          <span className="codex-side-heading">{group}</span>
          {items.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `codex-side-link${isActive ? ' active' : ''}`}>{link.label}</NavLink>)}
        </div> : null;
      })}
      {visible.length === 0 && <p className="codex-side-empty">No matching sections</p>}
    </nav>
  </aside>;
}
