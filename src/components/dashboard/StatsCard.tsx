
import React from 'react';
import { Calendar, User, DollarSign } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, onClick }) => {
  const getIcon = () => {
    switch (icon) {
      case 'calendar':
        return <Calendar className="w-5 h-5" />;
      case 'user':
        return <User className="w-5 h-5" />;
      case 'dollar':
        return <DollarSign className="w-5 h-5" />;
      case 'tooth':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M12 14c-1.65 0-3-1.35-3-3V4c0-1.65 1.35-3 3-3s3 1.35 3 3v7c0 1.65-1.35 3-3 3z" />
            <path d="M16 14v-3c0-2.21 1.79-4 4-4h.5" />
            <path d="M8 14v-3c0-2.21-1.79-4-4-4H3.5" />
            <path d="M12 17v3" />
            <path d="M10 20h4" />
          </svg>
        );
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow p-6 flex items-center ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className={`p-3 rounded-full ${color} mr-4`}>
        {getIcon()}
      </div>
      <div>
        <p className="text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
    </div>
  );
};

export default StatsCard;
