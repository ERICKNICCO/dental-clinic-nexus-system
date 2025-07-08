import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ReportList from '../components/ReportList';
import { useFinancialReports } from '../hooks/useFinancialReports';

const ReportPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { totalRevenue, loading } = useFinancialReports();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`main-content flex-1 flex flex-col overflow-hidden ${isSidebarCollapsed ? 'expanded ml-[70px]' : 'ml-64'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-500 text-sm mb-1">Total Revenue</div>
              <div className="text-2xl font-bold">{loading ? 'Loading...' : `Tsh ${totalRevenue.toLocaleString()}`}</div>
            </div>
          </div>
          <ReportList />
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
