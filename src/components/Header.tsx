
import React from 'react';
import { Menu, Bell, Search, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { logout, currentUser } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="mr-4 text-gray-600 hover:text-dental-600">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button className="text-gray-600 hover:text-dental-600">
            <Bell className="w-6 h-6" />
            <span className="appointment-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
          </button>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search..." 
            className="border border-gray-300 rounded-full py-1 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-dental-500"
          />
          <Search className="w-4 h-4 absolute left-3 top-2 text-gray-400" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{currentUser?.email}</span>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 text-gray-600 hover:text-dental-600"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
