
import React from 'react';
import { WeeklySchedule } from '../../types/schedule';
import { Appointment } from '../../types/appointment';

interface WeeklyScheduleCalendarProps {
  doctorSchedules: WeeklySchedule[];
  userRole?: 'admin' | 'doctor' | 'staff' | 'radiologist';
}

const WeeklyScheduleCalendar: React.FC<WeeklyScheduleCalendarProps> = ({ 
  doctorSchedules, 
  userRole = 'staff' 
}) => {
  // Updated time slots for 9:00-17:00 working hours
  const timeSlots = [
    '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];
  
  // Get current week's dates
  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Adjust for Sunday
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    
    return weekDates;
  };
  
  const weekDates = getCurrentWeekDates();
  const daysOfWeek = [
    { short: 'Mon', full: 'Monday', date: weekDates[0] },
    { short: 'Tue', full: 'Tuesday', date: weekDates[1] },
    { short: 'Wed', full: 'Wednesday', date: weekDates[2] },
    { short: 'Thu', full: 'Thursday', date: weekDates[3] },
    { short: 'Fri', full: 'Friday', date: weekDates[4] },
    { short: 'Sat', full: 'Saturday', date: weekDates[5] },
    { short: 'Sun', full: 'Sunday', date: weekDates[6] }
  ];

  const getDoctorColor = (doctorName: string) => {
    const colors = {
      'Dr. Shabbir': 'bg-blue-200 text-blue-800 border-blue-300',
      'Dr. Israel': 'bg-green-200 text-green-800 border-green-300',
      'Dr. Israel Kombole': 'bg-green-200 text-green-800 border-green-300',
      'Dr. Rashid': 'bg-yellow-200 text-yellow-800 border-yellow-300',
      'Dr. Nyaki': 'bg-pink-200 text-pink-800 border-pink-300',
      'Dr. Ewald Nyaki': 'bg-pink-200 text-pink-800 border-pink-300'
    };
    return colors[doctorName as keyof typeof colors] || 'bg-gray-200 text-gray-800 border-gray-300';
  };

  const getAppointmentsForSlot = (day: string, timeSlot: string, date: Date): Appointment[] => {
    const appointments: Appointment[] = [];
    const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    console.log(`🔍 Getting appointments for ${day} ${timeSlot} on ${dateString}`);
    
    doctorSchedules.forEach(doctor => {
      const daySchedule = doctor.schedule[day];
      if (daySchedule?.appointments) {
        const slotAppointments = daySchedule.appointments.filter(appointment => {
          // Check if appointment is on the correct date
          const appointmentDate = appointment.date;
          console.log(`🔍 Comparing appointment date ${appointmentDate} with ${dateString}`);
          
          if (appointmentDate !== dateString) {
            return false;
          }
          
          // Check if appointment time matches the slot
          const appointmentTimeStr = appointment.time.replace(/[^\d:]/g, '');
          const appointmentHour = parseInt(appointmentTimeStr.split(':')[0]);
          const slotHour = parseInt(timeSlot.split(':')[0]);
          
          console.log(`🔍 Comparing appointment hour ${appointmentHour} with slot hour ${slotHour}`);
          return appointmentHour === slotHour;
        });
        appointments.push(...slotAppointments);
      }
    });
    
    console.log(`🔍 Found ${appointments.length} appointments for ${day} ${timeSlot}`);
    return appointments;
  };

  const getCalendarTitle = () => {
    if (userRole === 'doctor') {
      return doctorSchedules.length > 0 ? `${doctorSchedules[0].doctorName} - Weekly Schedule` : 'My Weekly Schedule';
    }
    return 'Weekly Schedule';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Show message if no schedules are available
  if (doctorSchedules.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{getCalendarTitle()}</h2>
        <p className="text-gray-600">No appointments scheduled for this week</p>
        <p className="text-sm text-gray-500 mt-2">
          Week of {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">{getCalendarTitle()}</h2>
        {userRole === 'doctor' && doctorSchedules.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">Your personal schedule with appointments</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Working hours: 9:00 AM - 5:00 PM | Week of {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-8 border-b bg-gray-50">
            <div className="p-4 font-medium text-gray-700 border-r">Time</div>
            {daysOfWeek.map(day => (
              <div key={day.short} className="p-4 text-center border-r last:border-r-0">
                <div className="font-medium text-gray-900">{day.short}</div>
                <div className="text-xs text-gray-500 mt-1">{formatDate(day.date)}</div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          {timeSlots.map(timeSlot => (
            <div key={timeSlot} className="grid grid-cols-8 border-b hover:bg-gray-50">
              <div className="p-4 font-medium text-gray-600 border-r bg-blue-50">
                {timeSlot}
              </div>
              {daysOfWeek.map(day => {
                const appointments = getAppointmentsForSlot(day.full, timeSlot, day.date);
                
                return (
                  <div key={`${day.short}-${timeSlot}`} className="p-2 border-r last:border-r-0 min-h-[60px]">
                    <div className="space-y-1">
                      {/* Show appointments if any */}
                      {appointments.map(appointment => (
                        <div
                          key={`${appointment.id}-${day.short}-${timeSlot}`}
                          className={`text-xs p-2 rounded border ${getDoctorColor(appointment.dentist)}`}
                        >
                          <div className="font-medium">
                            {userRole === 'doctor' ? appointment.patient.name : appointment.dentist}
                          </div>
                          <div className="opacity-75">
                            {appointment.treatment}
                          </div>
                          <div className="text-xs opacity-60">
                            {appointment.time}
                          </div>
                        </div>
                      ))}
                      
                      {/* Show empty slot if no appointments */}
                      {appointments.length === 0 && (
                        <div className="text-xs text-gray-400 p-2">
                          Available
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduleCalendar;
