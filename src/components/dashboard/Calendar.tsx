
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppointments } from '../../hooks/useAppointments';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [realTimeDate, setRealTimeDate] = useState(new Date());
  const { appointments } = useAppointments();

  // Update real-time date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Get appointments for the current month and year
  const monthlyAppointments = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate.getFullYear() === year && 
             appointmentDate.getMonth() === month &&
             (appointment.status === 'Confirmed' || appointment.status === 'Approved');
    });
  }, [appointments, currentDate]);

  // Get appointments count for each day
  const appointmentsByDay = useMemo(() => {
    const dayMap: { [key: number]: number } = {};
    monthlyAppointments.forEach(appointment => {
      const day = new Date(appointment.date).getDate();
      dayMap[day] = (dayMap[day] || 0) + 1;
    });
    return dayMap;
  }, [monthlyAppointments]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  const days = [];
  const currentIterDate = new Date(startDate);

  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentIterDate));
    currentIterDate.setDate(currentIterDate.getDate() + 1);
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === realTimeDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Appointment Calendar</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-medium min-w-[140px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {days.map((day, index) => {
          const dayNumber = day.getDate();
          const appointmentCount = appointmentsByDay[dayNumber] || 0;
          const hasAppointments = appointmentCount > 0 && isCurrentMonth(day);
          
          return (
            <div
              key={index}
              className={`
                relative p-2 text-center text-sm cursor-pointer rounded-lg
                ${isCurrentMonth(day) ? 'text-gray-900' : 'text-gray-400'}
                ${isToday(day) ? 'bg-dental-600 text-white font-semibold' : 'hover:bg-gray-100'}
                ${hasAppointments && !isToday(day) ? 'bg-blue-50 text-blue-900' : ''}
              `}
            >
              {dayNumber}
              {hasAppointments && (
                <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
                  isToday(day) ? 'bg-white' : 'bg-blue-500'
                }`} />
              )}
              {hasAppointments && appointmentCount > 1 && (
                <div className={`absolute top-1 right-1 text-xs ${
                  isToday(day) ? 'text-white' : 'text-blue-600'
                }`}>
                  {appointmentCount}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Today: {realTimeDate.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        })}
      </div>
    </div>
  );
};

export default Calendar;
