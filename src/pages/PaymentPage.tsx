import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import PaymentList from '../components/PaymentList';
import { useAuth } from '../contexts/AuthContext';
import { useSidebarCollapseOnMobile } from '../hooks/useSidebarCollapseOnMobile';

const PaymentPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { userProfile } = useAuth();

  useSidebarCollapseOnMobile(setIsSidebarCollapsed);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Only admin can access payments
  if (userProfile?.role !== 'admin') {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
        
        <div className={`main-content flex-1 flex flex-col overflow-hidden ${isSidebarCollapsed ? 'expanded ml-[70px]' : 'ml-64'}`}>
          <Header toggleSidebar={toggleSidebar} />
          <div className="flex-1 overflow-auto p-6 bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center text-gray-500 py-8">
                <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                <p>Only administrators can access the payment management system.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`main-content flex-1 flex flex-col overflow-hidden ${isSidebarCollapsed ? 'expanded ml-[70px]' : 'ml-64'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <h1 className="text-2xl font-bold mb-6">Payment Management</h1>
          <PaymentList />
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
