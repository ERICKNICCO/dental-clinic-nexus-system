import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../contexts/AuthContext';

const AppointmentCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState('June 2025');
  const { appointments, loading } = useAppointments();
  const { userProfile } = useAuth();
  
  // Filter appointments for the current doctor if they are a doctor
  const doctorAppointments = userProfile?.role === 'doctor' 
    ? appointments.filter(appointment => {
        const appointmentDoctor = appointment.dentist?.toLowerCase() || '';
        const userDoctor = userProfile.name?.toLowerCase() || '';
        
        console.log('Calendar filtering - Appointment doctor:', appointmentDoctor, 'User:', userDoctor);
        
        return appointmentDoctor.includes(userDoctor) || 
               userDoctor.includes(appointmentDoctor) ||
               appointmentDoctor === userDoctor;
      })
    : appointments;

  // Get days with appointments for the current month, only from today onwards
  const getDaysWithAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    const currentMonthAppointments = doctorAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0); // Reset time for comparison
      
      // Only include appointments from today onwards
      return appointmentDate >= today &&
             appointmentDate.getMonth() === today.getMonth() && 
             appointmentDate.getFullYear() === today.getFullYear();
    });
    
    return currentMonthAppointments.map(appointment => {
      const date = new Date(appointment.date);
      return date.getDate();
    });
  };

  const daysWithAppointments = getDaysWithAppointments();
  const today = new Date().getDate();

  const handlePreviousMonth = () => {
    setCurrentMonth('May 2025');
  };

  const handleNextMonth = () => {
    setCurrentMonth('July 2025');
  };

  // Generate days for the demo calendar view
  const generateCalendarDays = () => {
    const days = [];
    const previousMonthDays = [28, 29, 30, 31];
    const currentMonthDays = Array.from({ length: 30 }, (_, i) => i + 1);
    const nextMonthDays = [1, 2, 3, 4, 5];
    
    // Add previous month days
    for (const day of previousMonthDays) {
      days.push({ day, isCurrentMonth: false });
    }
    
    // Add current month days
    for (const day of currentMonthDays) {
      days.push({
        day,
        isCurrentMonth: true,
        hasAppointment: daysWithAppointments.includes(day),
        isToday: day === today
      });
    }
    
    // Add next month days
    for (const day of nextMonthDays) {
      days.push({ day, isCurrentMonth: false });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dental-600"></div>
          <span className="ml-2">Loading calendar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {userProfile?.role === 'doctor' ? 'My Appointments' : 'Appointment Calendar'}
        </h2>
        <div className="flex space-x-2 items-center">
          <button 
            onClick={() => setCurrentMonth('May 2025')}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium">{currentMonth}</span>
          <button 
            onClick={() => setCurrentMonth('July 2025')}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        <div className="text-xs font-medium text-gray-500 py-1">Sun</div>
        <div className="text-xs font-medium text-gray-500 py-1">Mon</div>
        <div className="text-xs font-medium text-gray-500 py-1">Tue</div>
        <div className="text-xs font-medium text-gray-500 py-1">Wed</div>
        <div className="text-xs font-medium text-gray-500 py-1">Thu</div>
        <div className="text-xs font-medium text-gray-500 py-1">Fri</div>
        <div className="text-xs font-medium text-gray-500 py-1">Sat</div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div 
            key={index}
            className={`
              calendar-day py-2 rounded cursor-pointer text-center
              ${!day.isCurrentMonth ? 'text-gray-400' : ''}
              ${day.hasAppointment ? 'has-appointment' : ''}
              ${day.isToday ? 'today' : ''}
            `}
          >
            {day.day}
          </div>
        ))}
      </div>
      
      {userProfile?.role === 'doctor' && (
        <div className="mt-4 text-sm text-gray-600">
          Showing upcoming appointments for {userProfile.name}
          <div className="text-xs text-gray-500 mt-1">
            Found {doctorAppointments.filter(appt => new Date(appt.date) >= new Date()).length} upcoming appointments
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;
