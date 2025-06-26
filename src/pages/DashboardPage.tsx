
import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DashboardStats from '../components/dashboard/DashboardStats';
import DoctorDashboard from '../components/dashboard/DoctorDashboard';
import AdminNotifications from '../components/admin/AdminNotifications';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { userProfile } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const renderDashboardContent = () => {
    if (userProfile?.role === 'admin') {
      return (
        <div className="space-y-6">
          <DashboardStats />
          <AdminNotifications />
        </div>
      );
    } else if (userProfile?.role === 'doctor') {
      return <DoctorDashboard />;
    } else {
      // Default dashboard for staff or other roles
      return <DashboardStats />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`main-content flex-1 flex flex-col overflow-hidden ${isSidebarCollapsed ? 'expanded ml-[70px]' : 'ml-64'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <h1 className="text-2xl font-bold mb-6">
            {userProfile?.role === 'admin' ? 'Admin Dashboard' : 
             userProfile?.role === 'doctor' ? 'Doctor Dashboard' : 'Dashboard'}
          </h1>
          {renderDashboardContent()}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
