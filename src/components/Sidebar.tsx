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
  Bell,
  Activity,
  Database,
  Shield,
  CalendarDays,
  Music
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
  const rolePermissions: Record<string, string[]> = {
    admin: ['/', '/appointments', '/schedule', '/patients', '/treatments', '/payments', '/reports', '/pricing', '/admin/insurance-claims', '/admin/users', '/leave', '/music'],
    dentist: ['/', '/appointments', '/patients', '/schedule', '/treatments', '/pricing', '/leave', '/music'],
    receptionist: ['/', '/appointments', '/schedule', '/patients', '/treatments', '/payments', '/pricing', '/leave', '/music', '/admin/insurance-claims'],
    dental_assistant: ['/', '/appointments', '/patients', '/leave', '/music'],
    technician: ['/', '/xray-room', '/patients', '/leave', '/music'],
    finance_manager: ['/', '/appointments', '/patients', '/treatments', '/payments', '/reports', '/pricing', '/admin/insurance-claims', '/leave', '/music']
  };

  const userRole = userProfile?.role || 'receptionist';
  const allowedRoutes = rolePermissions[userRole] || rolePermissions.receptionist;

  // Single navigation list with consistent spacing
  const navigationItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/schedule', icon: Clock, label: 'Doctor Schedule' },
    { path: '/patients', icon: User, label: 'Patients' },
    { path: '/treatments', icon: Pill, label: 'Treatments' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
    { path: '/pricing', icon: DollarSign, label: 'Treatment Pricing' },
    { path: '/reports', icon: BarChart2, label: 'Reports' },
    { path: '/leave', icon: CalendarDays, label: 'Leave Management' },
    { path: '/music', icon: Music, label: 'Music Player' },
    { path: '/admin/insurance-claims', icon: Shield, label: 'Insurance Claims' },
    { path: '/admin/users', icon: Users, label: 'User Management' },
  ];

  const filteredNavigation = navigationItems.filter(item =>
    allowedRoutes.includes(item.path)
  );

  return (
    <div className={`
      sidebar bg-sidebar text-white h-full fixed left-0 top-0 z-50 flex flex-col transition-all duration-300
      ${isCollapsed ? 'w-[70px]' : 'w-64'}
    `}>
      {/* Logo Section */}
      <div className="p-4 flex items-center justify-center border-b border-sidebar-primary/20">
        <img
          src="/lovable-uploads/main logo.png"
          alt="Elite Dental Clinic Logo"
          className={isCollapsed ? 'h-8 w-8 object-contain' : 'h-10 object-contain'}
        />
      </div>

      {/* Navigation Section - Single clean list */}
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-4">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item px-6 py-3 flex items-center cursor-pointer transition-colors duration-200 ${location.pathname === item.path
                  ? 'bg-sidebar-primary text-white shadow-lg'
                  : 'hover:bg-sidebar-primary/20 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" style={{ marginRight: isCollapsed ? '0' : '12px' }} />
                {!isCollapsed && <span className="nav-text font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
