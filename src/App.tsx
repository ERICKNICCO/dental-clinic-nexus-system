import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Index from './pages/Index';
import AppointmentPage from './pages/AppointmentPage';
import PatientPage from './pages/PatientPage';
import PatientFilePage from './pages/PatientFilePage';
import SchedulePage from './pages/SchedulePage';
import TreatmentPage from './pages/TreatmentPage';
import ReportPage from './pages/ReportPage';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import PaymentPage from './pages/PaymentPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin', 'staff']}>
                  <AppointmentPage />
                </RoleBasedRoute>
              </ProtectedRoute>
            } />
            <Route path="/patients" element={
              <ProtectedRoute>
                <PatientPage />
              </ProtectedRoute>
            } />
            <Route path="/patients/:id" element={
              <ProtectedRoute>
                <PatientFilePage />
              </ProtectedRoute>
            } />
            <Route path="/schedule" element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin', 'doctor']}>
                  <SchedulePage />
                </RoleBasedRoute>
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
            <Route path="/reports" element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin']}>
                  <ReportPage />
                </RoleBasedRoute>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
