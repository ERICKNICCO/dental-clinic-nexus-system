
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import LoginPage from './pages/LoginPage';
import Index from './pages/Index';
import PatientPage from './pages/PatientPage';
import PatientFilePage from './pages/PatientFilePage';
import AppointmentPage from './pages/AppointmentPage';
import TreatmentPage from './pages/TreatmentPage';
import PaymentPage from './pages/PaymentPage';
import ReportPage from './pages/ReportPage';
import InventoryPage from './pages/InventoryPage';
import SchedulePage from './pages/SchedulePage';
import TreatmentPricingPage from './pages/TreatmentPricingPage';
import NotFound from './pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/patients" element={
                <ProtectedRoute>
                  <PatientPage />
                </ProtectedRoute>
              } />
              <Route path="/patient/:patientId/file" element={
                <ProtectedRoute>
                  <PatientFilePage />
                </ProtectedRoute>
              } />
              <Route path="/patients/:patientId/file" element={
                <ProtectedRoute>
                  <PatientFilePage />
                </ProtectedRoute>
              } />
              <Route path="/appointments" element={
                <ProtectedRoute>
                  <AppointmentPage />
                </ProtectedRoute>
              } />
              <Route path="/treatments" element={
                <ProtectedRoute>
                  <TreatmentPage />
                </ProtectedRoute>
              } />
              <Route path="/payments" element={
                <ProtectedRoute>
                  <PaymentPage />
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
              <Route path="/schedule" element={
                <ProtectedRoute>
                  <SchedulePage />
                </ProtectedRoute>
              } />
              <Route path="/treatment-pricing" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <TreatmentPricingPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
