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
import InventoryPage from './pages/InventoryPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import './App.css';
import { XRayRoomPage } from './components/xray/XRayRoomPage';
import NotificationTest from './components/NotificationTest';
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage';
import GASmartTestPage from './pages/GASmartTestPage';

const queryClient = new QueryClient();

function AppRoutes() {
  const { userProfile } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin', 'staff', 'doctor']}>
            <AppointmentPage />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      <Route path="/schedule" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin', 'doctor']}>
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
      <Route path="/treatments" element={
        <ProtectedRoute>
          <TreatmentPage />
        </ProtectedRoute>
      } />
      <Route path="/payments" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin']}>
            <PaymentPage />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      <Route path="/pricing" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin', 'doctor']}>
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
      <Route path="/inventory" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['admin']}>
            <InventoryPage />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      <Route path="/xray-room" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={['radiologist']}>
            <XRayRoomPage />
          </RoleBasedRoute>
        </ProtectedRoute>
      } />
      <Route path="/notification-test" element={
        <ProtectedRoute>
          <NotificationTest />
        </ProtectedRoute>
      } />
      <Route path="/ga-test" element={
        <ProtectedRoute>
          <RoleBasedRoute allowedRoles={["admin","doctor"]}>
            <GASmartTestPage />
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
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
