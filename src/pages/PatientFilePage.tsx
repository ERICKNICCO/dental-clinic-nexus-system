
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import PatientFileContent from '../components/patient/PatientFileContent';

const PatientFilePage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { patientId } = useParams();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={`main-content flex-1 flex flex-col overflow-hidden ${isSidebarCollapsed ? 'expanded ml-[70px]' : 'ml-64'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <PatientFileContent patientId={patientId} />
        </div>
      </div>
    </div>
  );
};

export default PatientFilePage;
