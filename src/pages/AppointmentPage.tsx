
import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import AppointmentList from '../components/AppointmentList';

const AppointmentPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`main-content flex-1 flex flex-col overflow-hidden ${isSidebarCollapsed ? 'expanded ml-[70px]' : 'ml-64'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <h1 className="text-2xl font-bold mb-6">Appointments</h1>
          <AppointmentList />
        </div>
      </div>
    </div>
  );
};

export default AppointmentPage;
