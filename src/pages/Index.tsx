import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import { useSidebarCollapseOnMobile } from '../hooks/useSidebarCollapseOnMobile';

const Index = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useSidebarCollapseOnMobile(setIsSidebarCollapsed);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`flex-1 flex flex-col overflow-hidden ${isSidebarCollapsed ? 'ml-[70px]' : 'ml-64'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <Dashboard />
      </div>
    </div>
  );
};

export default Index;
