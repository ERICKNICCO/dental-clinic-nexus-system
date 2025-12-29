import React, { useState } from 'react';
import { Menu, User, Settings, LogOut, Search, Bell, Activity, HelpCircle, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { HeaderMiniPlayer } from './music/HeaderMiniPlayer';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { userProfile, currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get user-specific profile picture
  // Use generic 'profilePicture' only if no user ID (legacy fallback)
  const profilePicKey = currentUser?.id ? `profilePicture_${currentUser.id}` : 'profilePicture';
  const profilePic = localStorage.getItem(profilePicKey) || (currentUser?.id ? null : localStorage.getItem('profilePicture'));

  const handleLogout = () => {
    logout();
  };

  // Get current page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/xray-room':
        return 'X-ray Room';
      case '/appointments':
        return 'Appointments';
      case '/patients':
        return 'Patients';
      case '/treatments':
        return 'Treatments';
      case '/payments':
        return 'Payments';
      case '/reports':
        return 'Reports';
      case '/schedule':
        return 'Doctor Schedule';
      case '/pricing':
        return 'Treatment Pricing';
      case '/admin/insurance-claims':
        return 'Insurance Claims';
      case '/jubilee-test':
        return 'Jubilee Testing';
      case '/jubilee-config':
        return 'Jubilee Configuration';
      case '/jubilee-status':
        return 'Jubilee Status';
      case '/profile':
        return 'My Profile';
      case '/settings':
        return 'Settings';

      default:
        return 'Dashboard';
    }
  };

  // Get breadcrumb path
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/xray-room') return 'X-ray Room';
    return `${getPageTitle()}`;
  };

  return (
    <header className="bg-white border-b border-gray-200 z-30 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-dental-500 transition-colors duration-200"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900">{getBreadcrumb()}</span>
            </div>
          </div>

          {/* Center Section - Mini Player */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
            <HeaderMiniPlayer />
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">

            {/* Quick Actions */}
            <div className="hidden sm:flex items-center space-x-2">
              <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-dental-500 transition-colors duration-200">
                <Activity className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-dental-500 transition-colors duration-200">
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-dental-500 transition-colors duration-200"
              >
                {profilePic ? (
                  <img
                    src={profilePic || ''}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-sidebar rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-700">
                    {userProfile?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userProfile?.role || 'User'}
                  </p>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{userProfile?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{userProfile?.role}</p>
                      <p className="text-xs text-gray-400 mt-1">{userProfile?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/profile');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors duration-200"
                    >
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors duration-200"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </button>

                    <div className="border-t border-gray-200 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors duration-200"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="lg:hidden border-t border-gray-200 px-4 py-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-dental-500 focus:border-dental-500 sm:text-sm"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
