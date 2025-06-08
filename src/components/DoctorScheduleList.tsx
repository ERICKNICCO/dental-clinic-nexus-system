
import React, { useState } from 'react';
import DoctorScheduleCard from './schedule/DoctorScheduleCard';
import WeeklyScheduleCalendar from './schedule/WeeklyScheduleCalendar';
import { getWeeklyScheduleByDoctor } from './schedule/scheduleUtils';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Grid3X3 } from 'lucide-react';

const DoctorScheduleList: React.FC = () => {
  const [viewMode, setViewMode] = useState<'calendar' | 'cards'>('calendar');
  const { userProfile } = useAuth();
  const allDoctorSchedules = getWeeklyScheduleByDoctor();

  // Filter schedules based on user role
  const doctorSchedules = React.useMemo(() => {
    if (!userProfile) return allDoctorSchedules;

    // If user is a doctor, show only their schedule
    if (userProfile.role === 'doctor') {
      const doctorName = userProfile.name;
      
      // Helper function to normalize doctor names for comparison
      const normalizeDoctorName = (name: string) => {
        if (!name) return '';
        return name.toLowerCase()
          .replace(/^dr\.?\s*/i, '') // Remove "Dr." or "Dr" prefix
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
      };

      // Helper function to check if two doctor names match
      const isDoctorNameMatch = (scheduleName: string, userName: string) => {
        const normalizedScheduleName = normalizeDoctorName(scheduleName);
        const normalizedUserName = normalizeDoctorName(userName);
        
        console.log('Comparing schedule doctor:', normalizedScheduleName, 'with user:', normalizedUserName);
        
        // Exact match
        if (normalizedScheduleName === normalizedUserName) {
          return true;
        }
        
        // Split into words for better matching
        const scheduleWords = normalizedScheduleName.split(' ').filter(word => word.length > 0);
        const userWords = normalizedUserName.split(' ').filter(word => word.length > 0);
        
        // Check if any word matches
        for (const scheduleWord of scheduleWords) {
          for (const userWord of userWords) {
            if (scheduleWord === userWord) {
              return true;
            }
          }
        }
        
        // Check if one name contains the other
        return normalizedScheduleName.includes(normalizedUserName) || 
               normalizedUserName.includes(normalizedScheduleName);
      };

      const filteredSchedules = allDoctorSchedules.filter(schedule => 
        isDoctorNameMatch(schedule.doctorName, doctorName)
      );

      console.log('Doctor filtering - User:', doctorName);
      console.log('Doctor filtering - Available schedules:', allDoctorSchedules.map(s => s.doctorName));
      console.log('Doctor filtering - Filtered schedules:', filteredSchedules.map(s => s.doctorName));

      return filteredSchedules;
    }

    // For admin and staff, show all schedules
    return allDoctorSchedules;
  }, [allDoctorSchedules, userProfile]);

  // Get title based on user role
  const getPageTitle = () => {
    if (userProfile?.role === 'doctor') {
      return 'My Schedule';
    }
    return 'Doctor Schedules';
  };

  const getScheduleTitle = () => {
    if (userProfile?.role === 'doctor') {
      return 'My Weekly Schedule';
    }
    return 'Doctor Schedules';
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{getScheduleTitle()}</h2>
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
            {userProfile?.role === 'admin' && (
              <button className="bg-dental-600 text-white px-4 py-2 rounded-lg hover:bg-dental-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Edit Schedule
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {doctorSchedules.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center text-gray-500 py-8">
            <p>
              {userProfile?.role === 'doctor' 
                ? 'No schedule found for your account' 
                : 'No doctor schedules available'
              }
            </p>
            {userProfile?.role === 'doctor' && (
              <div className="text-xs text-gray-400 mt-2">
                Looking for schedule for: {userProfile.name}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'calendar' ? (
            <WeeklyScheduleCalendar 
              doctorSchedules={doctorSchedules} 
              userRole={userProfile?.role || 'staff'}
            />
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
        </>
      )}
      
      {userProfile?.role === 'doctor' && doctorSchedules.length > 0 && (
        <div className="text-sm text-gray-600 bg-white rounded-lg shadow-sm p-4">
          Showing schedule for: <span className="font-medium">{userProfile.name}</span>
        </div>
      )}
    </div>
  );
};

export default DoctorScheduleList;
