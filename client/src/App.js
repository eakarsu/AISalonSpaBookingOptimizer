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
import BookingCalendarPage from './pages/BookingCalendarPage';
import CommissionTrackerPage from './pages/CommissionTrackerPage';
import RebookQueuePage from './pages/RebookQueuePage';
import ReminderMessagePage from './pages/ReminderMessagePage';
import ServiceDemandForecastPage from './pages/ServiceDemandForecastPage';
import StylistWorkloadBalancePage from './pages/StylistWorkloadBalancePage';
import AppointmentConflictPage from './pages/AppointmentConflictPage';
import CommissionOptimizationPage from './pages/CommissionOptimizationPage';
import RetailRecommendPage from './pages/RetailRecommendPage';
import Navbar from './components/Navbar';

// === Batch 07 Gaps & Frontend Mounts ===
import CfSmartServiceBundling from './pages/CfSmartServiceBundling';
import CfStylistSkillTaggingMatching from './pages/CfStylistSkillTaggingMatching';
import CfDynamicServicePricing from './pages/CfDynamicServicePricing';
import CfClientLifetimeValueScoring from './pages/CfClientLifetimeValueScoring';
import CfInventoryManagementAutomation from './pages/CfInventoryManagementAutomation';
import CfWaitlistFulfillmentAi from './pages/CfWaitlistFulfillmentAi';
import GapNoServicedemandforecastBusytimePrediction from './pages/GapNoServicedemandforecastBusytimePrediction';
import GapNoStylistworkloadbalance from './pages/GapNoStylistworkloadbalance';
import GapNoCommissionoptimization from './pages/GapNoCommissionoptimization';
import GapNoRetailrecommendProductToAddToService from './pages/GapNoRetailrecommendProductToAddToService';
import GapNoAppointmentconflictdetection from './pages/GapNoAppointmentconflictdetection';
import GapNoNoshowPrediction from './pages/GapNoNoshowPrediction';
import GapNoPublicOnlineBookingWidgetApi from './pages/GapNoPublicOnlineBookingWidgetApi';
import GapNoAutomatedReminderSmsemailCommunication from './pages/GapNoAutomatedReminderSmsemailCommunication';
import GapNoSupplierReorderAutomation from './pages/GapNoSupplierReorderAutomation';
import GapNoStaffAbsenceCoveragePlanning from './pages/GapNoStaffAbsenceCoveragePlanning';
import GapNoPaymentProcessorIntegration from './pages/GapNoPaymentProcessorIntegration';
import GapNoPosHardwareIntegration from './pages/GapNoPosHardwareIntegration';
// === End Batch 07 ===

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
            <Route path="/booking-calendar" element={<BookingCalendarPage />} />
            <Route path="/commissions" element={<CommissionTrackerPage />} />
            <Route path="/rebook-queue" element={<RebookQueuePage />} />
            <Route path="/reminders" element={<ReminderMessagePage />} />
            <Route path="/ai/service-demand-forecast" element={<ServiceDemandForecastPage />} />
            <Route path="/ai/stylist-workload-balance" element={<StylistWorkloadBalancePage />} />
            <Route path="/ai/appointment-conflict-detection" element={<AppointmentConflictPage />} />
            <Route path="/ai/commission-optimization" element={<CommissionOptimizationPage />} />
            <Route path="/ai/retail-recommend" element={<RetailRecommendPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          // === Batch 07 Gaps & Frontend Mounts ===
          <Route path='/cf-smart-service-bundling' element={<CfSmartServiceBundling />} />
          <Route path='/cf-stylist-skill-tagging-matching' element={<CfStylistSkillTaggingMatching />} />
          <Route path='/cf-dynamic-service-pricing' element={<CfDynamicServicePricing />} />
          <Route path='/cf-client-lifetime-value-scoring' element={<CfClientLifetimeValueScoring />} />
          <Route path='/cf-inventory-management-automation' element={<CfInventoryManagementAutomation />} />
          <Route path='/cf-waitlist-fulfillment-ai' element={<CfWaitlistFulfillmentAi />} />
          <Route path='/gap-no-servicedemandforecast-busytime-prediction' element={<GapNoServicedemandforecastBusytimePrediction />} />
          <Route path='/gap-no-stylistworkloadbalance' element={<GapNoStylistworkloadbalance />} />
          <Route path='/gap-no-commissionoptimization' element={<GapNoCommissionoptimization />} />
          <Route path='/gap-no-retailrecommend-product-to-add-to-service' element={<GapNoRetailrecommendProductToAddToService />} />
          <Route path='/gap-no-appointmentconflictdetection' element={<GapNoAppointmentconflictdetection />} />
          <Route path='/gap-no-noshow-prediction' element={<GapNoNoshowPrediction />} />
          <Route path='/gap-no-public-online-booking-widget-api' element={<GapNoPublicOnlineBookingWidgetApi />} />
          <Route path='/gap-no-automated-reminder-smsemail-communication' element={<GapNoAutomatedReminderSmsemailCommunication />} />
          <Route path='/gap-no-supplier-reorder-automation' element={<GapNoSupplierReorderAutomation />} />
          <Route path='/gap-no-staff-absence-coverage-planning' element={<GapNoStaffAbsenceCoveragePlanning />} />
          <Route path='/gap-no-payment-processor-integration' element={<GapNoPaymentProcessorIntegration />} />
          <Route path='/gap-no-pos-hardware-integration' element={<GapNoPosHardwareIntegration />} />
          // === End Batch 07 ===
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
