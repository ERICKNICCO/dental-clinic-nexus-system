
import React from 'react';
import { Search, Filter, Calendar, Plus } from 'lucide-react';

interface AppointmentFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  onNewAppointment: () => void;
}

const AppointmentFilters: React.FC<AppointmentFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  selectedDate,
  setSelectedDate,
  onNewAppointment
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      {/* Search Bar */}
      <div className="relative w-full sm:w-auto">
        <input
          type="text"
          placeholder="Search appointments..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-dental-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Status Filter */}
        <div className="relative flex-1 sm:flex-none">
          <select
            className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-dental-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Approved">Approved</option>
          </select>
          <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <div className="absolute right-3 top-2.5 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        {/* Date Picker */}
        <div className="relative flex-1 sm:flex-none">
          <input
            type="date"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-dental-500"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        {/* New Appointment Button */}
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-dental-600 text-white rounded-lg hover:bg-dental-700"
          onClick={onNewAppointment}
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">New Appointment</span>
        </button>
      </div>
    </div>
  );
};

export default AppointmentFilters;
