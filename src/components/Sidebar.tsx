import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Calendar,
  User,
  FileText,
  DollarSign,
  CreditCard,
  BarChart2,
  Users,
  Pill,
  Clock,
  Settings,
  Scan,
  Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();
  const { userProfile } = useAuth();
  
  // Define which routes each role can access
  const rolePermissions = {
    admin: ['/', '/appointments', '/schedule', '/patients', '/treatments', '/payments', '/reports', '/pricing'],
    doctor: ['/', '/appointments', '/patients', '/schedule', '/treatments'],
    staff: ['/', '/appointments', '/patients', '/treatments'],
    radiologist: ['/xray-room'] // Only give access to the X-ray Room
  };

  const userRole = userProfile?.role || 'doctor';
  const allowedRoutes = rolePermissions[userRole];

  const navigationItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/schedule', icon: Clock, label: 'Doctor Schedule' },
    { path: '/patients', icon: User, label: 'Patients' },
    { path: '/treatments', icon: Pill, label: 'Treatments' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
    { path: '/pricing', icon: DollarSign, label: 'Treatment Pricing' },
    { path: '/reports', icon: BarChart2, label: 'Reports' },
    { path: '/xray-room', icon: Scan, label: 'X-ray Room' }
  ];

  const filteredNavigation = navigationItems.filter(item => 
    allowedRoutes.includes(item.path)
  );
  
  return (
    <div className={`sidebar bg-sidebar text-white h-full fixed left-0 top-0 z-50 ${isCollapsed ? 'collapsed w-[70px]' : 'w-64'}`}>
      <div className="p-4 flex items-center justify-center">
        {isCollapsed ? (
          <img 
            src="/lovable-uploads/7894f073-6ef4-4509-aa4c-9dc1418c0e33.png" 
            alt="Dental Clinic Symbol" 
            className="h-6 w-6" 
          />
        ) : (
          <img 
            src="/lovable-uploads/d94b5e13-85e8-4838-a5ff-fdb2a3e22f9e.png" 
            alt="Dental Clinic Logo" 
            className="h-8" 
          />
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-6">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`nav-item px-6 py-3 flex items-center cursor-pointer ${
                  location.pathname === item.path ? 'bg-sidebar-primary' : 'hover:bg-sidebar-primary'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="nav-text">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
