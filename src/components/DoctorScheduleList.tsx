
import React from 'react';
import WeeklyScheduleCalendar from './schedule/WeeklyScheduleCalendar';
import { getWeeklyScheduleByDoctor } from './schedule/scheduleUtils';
import { useAuth } from '../contexts/AuthContext';
import { useAppointments } from '../hooks/useAppointments';

const DoctorScheduleList: React.FC = () => {
  const { userProfile } = useAuth();
  const { appointments, loading } = useAppointments();

  // Generate schedules with real appointment data
  const allDoctorSchedules = React.useMemo(() => {
    return getWeeklyScheduleByDoctor(appointments);
  }, [appointments]);

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

      return filteredSchedules;
    }

    // For admin and staff, show all schedules
    // (Radiologists will see nothing - not relevant to them)
    return allDoctorSchedules;
  }, [allDoctorSchedules, userProfile]);

  // Get title based on user role
  const getScheduleTitle = () => {
    if (userProfile?.role === 'doctor') {
      return 'My Weekly Schedule';
    }
    return 'Doctor Schedules';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dental-600"></div>
            <span className="ml-2">Loading schedules...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{getScheduleTitle()}</h2>
          <div className="flex items-center space-x-4">
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
        <WeeklyScheduleCalendar 
          doctorSchedules={doctorSchedules} 
          userRole={userProfile?.role as "admin" | "doctor" | "staff" | "radiologist"}
        />
      )}
      
      {userProfile?.role === 'doctor' && doctorSchedules.length > 0 && (
        <div className="text-sm text-gray-600 bg-white rounded-lg shadow-sm p-4">
          Showing schedule for: <span className="font-medium">{userProfile.name}</span>
          <div className="text-xs text-gray-500 mt-1">
            Working hours: 9:00 AM - 5:00 PM (Monday - Friday)
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorScheduleList;
