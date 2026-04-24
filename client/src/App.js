import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StylistsPage from './pages/StylistsPage';
import ServicesPage from './pages/ServicesPage';
import ClientsPage from './pages/ClientsPage';
import BookingsPage from './pages/BookingsPage';
import ProductsPage from './pages/ProductsPage';
import WaitlistPage from './pages/WaitlistPage';
import AIFeaturesPage from './pages/AIFeaturesPage';
import SchedulesPage from './pages/SchedulesPage';
import ReviewsPage from './pages/ReviewsPage';
import PromotionsPage from './pages/PromotionsPage';
import InventoryPage from './pages/InventoryPage';
import LoyaltyPage from './pages/LoyaltyPage';
import ReportsPage from './pages/ReportsPage';
import GiftCardsPage from './pages/GiftCardsPage';
import ExpensesPage from './pages/ExpensesPage';
import CommunicationsPage from './pages/CommunicationsPage';
import PerformancePage from './pages/PerformancePage';
import CalendarPage from './pages/CalendarPage';
import TipsPage from './pages/TipsPage';
import CheckinPage from './pages/CheckinPage';
import MembershipsPage from './pages/MembershipsPage';
import SuppliersPage from './pages/SuppliersPage';
import PayrollPage from './pages/PayrollPage';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stylists" element={<StylistsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/waitlist" element={<WaitlistPage />} />
            <Route path="/ai" element={<AIFeaturesPage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/loyalty" element={<LoyaltyPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/giftcards" element={<GiftCardsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/communications" element={<CommunicationsPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/tips" element={<TipsPage />} />
            <Route path="/checkin" element={<CheckinPage />} />
            <Route path="/memberships" element={<MembershipsPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
