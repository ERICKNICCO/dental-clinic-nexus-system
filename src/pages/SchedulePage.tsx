
import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DoctorScheduleList from '../components/DoctorScheduleList';
import { useAuth } from '../contexts/AuthContext';

const SchedulePage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { userProfile } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const getPageTitle = () => {
    if (userProfile?.role === 'doctor') {
      return 'My Schedule';
    }
    return 'Doctor Schedules';
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`main-content flex-1 flex flex-col overflow-hidden ${isSidebarCollapsed ? 'expanded ml-[70px]' : 'ml-64'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <h1 className="text-2xl font-bold mb-6">{getPageTitle()}</h1>
          <DoctorScheduleList />
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
