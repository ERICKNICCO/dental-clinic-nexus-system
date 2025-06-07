
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from "react";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import LoginPage from "./pages/LoginPage";
import Index from "./pages/Index";
import PatientPage from "./pages/PatientPage";
import PatientFilePage from "./pages/PatientFilePage";
import TreatmentPage from "./pages/TreatmentPage";
import AppointmentPage from "./pages/AppointmentPage";
import SchedulePage from "./pages/SchedulePage";
import InventoryPage from "./pages/InventoryPage";
import ReportPage from "./pages/ReportPage";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/patients" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin', 'doctor', 'staff']}>
                    <PatientPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="/patients/:patientId/file" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin', 'doctor', 'staff']}>
                    <PatientFilePage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="/treatments" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin', 'doctor', 'staff']}>
                    <TreatmentPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="/appointments" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin', 'staff']}>
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
              <Route path="/inventory" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <InventoryPage />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
