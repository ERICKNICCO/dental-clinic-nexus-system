
import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import TreatmentList from '../components/TreatmentList';
import AdminTreatmentView from '../components/treatments/AdminTreatmentView';
import DoctorTreatmentView from '../components/treatments/DoctorTreatmentView';
import { useAuth } from '../contexts/AuthContext';

const TreatmentPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { userProfile } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const renderTreatmentContent = () => {
    if (userProfile?.role === 'admin') {
      return <AdminTreatmentView />;
    } else if (userProfile?.role === 'doctor') {
      return <DoctorTreatmentView />;
    } else {
      // Default to treatment list for staff or other roles
      return <TreatmentList />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`main-content flex-1 flex flex-col overflow-hidden ${isSidebarCollapsed ? 'expanded ml-[70px]' : 'ml-64'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <h1 className="text-2xl font-bold mb-6">
            {userProfile?.role === 'admin' ? 'Treatment Records' : 
             userProfile?.role === 'doctor' ? 'My Treatments' : 'Treatments'}
          </h1>
          {renderTreatmentContent()}
        </div>
      </div>
    </div>
  );
};

export default TreatmentPage;
