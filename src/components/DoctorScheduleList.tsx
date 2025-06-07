
import React, { useState } from 'react';
import DoctorScheduleCard from './schedule/DoctorScheduleCard';
import WeeklyScheduleCalendar from './schedule/WeeklyScheduleCalendar';
import { getWeeklyScheduleByDoctor } from './schedule/scheduleUtils';
import { Calendar, Grid3X3 } from 'lucide-react';

const DoctorScheduleList: React.FC = () => {
  const [viewMode, setViewMode] = useState<'calendar' | 'cards'>('calendar');
  const doctorSchedules = getWeeklyScheduleByDoctor();

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Doctor Schedules</h2>
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-dental-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar View
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-dental-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Card View
              </button>
            </div>
            <button className="bg-dental-600 text-white px-4 py-2 rounded-lg hover:bg-dental-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Edit Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <WeeklyScheduleCalendar doctorSchedules={doctorSchedules} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {doctorSchedules.map((schedule) => (
              <DoctorScheduleCard 
                key={schedule.doctorName} 
                doctorSchedule={schedule} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorScheduleList;
