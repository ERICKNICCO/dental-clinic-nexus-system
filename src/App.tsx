import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import Index from './pages/Index';
import LoginPage from './pages/LoginPage';
import AppointmentPage from './pages/AppointmentPage';
import PatientPage from './pages/PatientPage';
import PatientFilePage from './pages/PatientFilePage';
import TreatmentPage from './pages/TreatmentPage';
import PaymentPage from './pages/PaymentPage';
import TreatmentPricingPage from './pages/TreatmentPricingPage';
import ReportPage from './pages/ReportPage';
import SchedulePage from './pages/SchedulePage';
import GAPatientBenefitsPage from './pages/GAPatientBenefitsPage';
import GASmartTestPage from './pages/GASmartTestPage';

import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import './App.css';
import { XRayRoomPage } from './components/xray/XRayRoomPage';
import NotificationTest from './components/NotificationTest';
import { EmailNotificationTest } from './components/EmailNotificationTest';
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminInsuranceClaimsPage from './pages/AdminInsuranceClaimsPage';
import { LeaveManagementPage } from './components/leave/LeaveManagementPage';
import { MusicPlayerPage } from './components/music/MusicPlayerPage';
import { MusicProvider } from './contexts/MusicContext';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import StaffRegisterPage from './pages/StaffRegisterPage';
import UserManagementPage from './pages/UserManagementPage';

const queryClient = new QueryClient();

function AppRoutes() {
  const { userProfile } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<StaffRegisterPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin', 'receptionist', 'dentist']}>
            <AppointmentPage />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      <Route path="/schedule" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin', 'dentist', 'receptionist']}>
            <SchedulePage />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      <Route path="/patients" element={
        <ProtectedRoute>
          <PatientPage />
        </ProtectedRoute>
      } />
      <Route path="/patients/:patientId" element={
        <ProtectedRoute>
          <PatientFilePage />
        </ProtectedRoute>
      } />
      <Route path="/patients/:patientId/file" element={
        <ProtectedRoute>
          <PatientFilePage />
        </ProtectedRoute>
      } />
      <Route path="/patients/:patientId/consultation" element={
        <ProtectedRoute>
          <PatientFilePage />
        </ProtectedRoute>
      } />
      <Route path="/treatments" element={
        <ProtectedRoute>
          <TreatmentPage />
        </ProtectedRoute>
      } />
      <Route path="/payments" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin', 'receptionist', 'finance_manager']}>
            <PaymentPage />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      <Route path="/pricing" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin', 'dentist', 'receptionist', 'finance_manager']}>
            <TreatmentPricingPage />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin']}>
            <ReportPage />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      <Route path="/ga-insurance" element={
        <ProtectedRoute>
          <GAPatientBenefitsPage />
        </ProtectedRoute>
      } />

      <Route path="/ga-test" element={
        <ProtectedRoute>
          <GASmartTestPage />
        </ProtectedRoute>
      } />

      <Route path="/xray-room" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['technician', 'dentist', 'admin']}>
            <XRayRoomPage />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      <Route path="/notification-test" element={
        <ProtectedRoute>
          <NotificationTest />
        </ProtectedRoute>
      } />
      <Route path="/email-test" element={
        <ProtectedRoute>
          <EmailNotificationTest />
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      } />
      <Route path="/leave" element={
        <ProtectedRoute>
          <LeaveManagementPage />
        </ProtectedRoute>
      } />
      <Route path="/music" element={
        <ProtectedRoute>
          <MusicPlayerPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/insurance-claims" element={
        <RoleBasedRoute allowedRoles={['admin', 'receptionist', 'finance_manager']}>
          <AdminInsuranceClaimsPage />
        </RoleBasedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin']}>
            <UserManagementPage />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MusicProvider>
          <Router>
            <div className="App">
              <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <AppRoutes />
              </React.Suspense>
            </div>
          </Router>
          <Toaster />
        </MusicProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
