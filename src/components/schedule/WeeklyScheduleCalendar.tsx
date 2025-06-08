
import React from 'react';
import { WeeklySchedule } from '../../types/schedule';

interface WeeklyScheduleCalendarProps {
  doctorSchedules: WeeklySchedule[];
  userRole?: 'admin' | 'doctor' | 'staff';
}

const WeeklyScheduleCalendar: React.FC<WeeklyScheduleCalendarProps> = ({ 
  doctorSchedules, 
  userRole = 'staff' 
}) => {
  const timeSlots = [
    '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];
  
  const daysOfWeek = [
    { short: 'Tue', full: 'Tuesday', date: 'Jun 3' },
    { short: 'Wed', full: 'Wednesday', date: 'Jun 4' },
    { short: 'Thu', full: 'Thursday', date: 'Jun 5' },
    { short: 'Fri', full: 'Friday', date: 'Jun 6' },
    { short: 'Sat', full: 'Saturday', date: 'Jun 7' },
    { short: 'Sun', full: 'Sunday', date: 'Jun 8' },
    { short: 'Mon', full: 'Monday', date: 'Jun 9' }
  ];

  const getDoctorColor = (doctorName: string) => {
    const colors = {
      'Dr. Shabbir': 'bg-blue-200 text-blue-800 border-blue-300',
      'Dr. Israel': 'bg-green-200 text-green-800 border-green-300',
      'Dr. Rashid': 'bg-yellow-200 text-yellow-800 border-yellow-300',
      'Dr. Nyaki': 'bg-pink-200 text-pink-800 border-pink-300'
    };
    return colors[doctorName as keyof typeof colors] || 'bg-gray-200 text-gray-800 border-gray-300';
  };

  const isTimeInRange = (timeSlot: string, startTime: string, endTime: string) => {
    if (!startTime || !endTime) return false;
    
    const slotHour = parseInt(timeSlot.split(':')[0]);
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    
    return slotHour >= startHour && slotHour < endHour;
  };

  const getAvailableDoctors = (day: string, timeSlot: string) => {
    return doctorSchedules.filter(doctor => {
      const daySchedule = doctor.schedule[day];
      return daySchedule?.isAvailable && isTimeInRange(timeSlot, daySchedule.startTime, daySchedule.endTime);
    });
  };

  const getCalendarTitle = () => {
    if (userRole === 'doctor') {
      return doctorSchedules.length > 0 ? `${doctorSchedules[0].doctorName} - Weekly Schedule` : 'My Weekly Schedule';
    }
    return 'Weekly Schedule';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">{getCalendarTitle()}</h2>
        {userRole === 'doctor' && doctorSchedules.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">Your personal schedule</p>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-8 border-b bg-gray-50">
            <div className="p-4 font-medium text-gray-700 border-r">Time</div>
            {daysOfWeek.map(day => (
              <div key={day.short} className="p-4 text-center border-r last:border-r-0">
                <div className="font-medium text-gray-900">{day.short}</div>
                <div className="text-xs text-gray-500 mt-1">{day.date}</div>
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
                const availableDoctors = getAvailableDoctors(day.full, timeSlot);
                return (
                  <div key={`${day.short}-${timeSlot}`} className="p-2 border-r last:border-r-0 min-h-[60px]">
                    <div className="space-y-1">
                      {availableDoctors.map(doctor => (
                        <div
                          key={`${doctor.doctorName}-${day.short}-${timeSlot}`}
                          className={`text-xs p-2 rounded border ${getDoctorColor(doctor.doctorName)} cursor-pointer hover:opacity-80 transition-opacity`}
                        >
                          <div className="font-medium">
                            {userRole === 'doctor' ? 'Available' : doctor.doctorName}
                          </div>
                          <div className="opacity-75">
                            {doctor.schedule[day.full]?.startTime} - {doctor.schedule[day.full]?.endTime}
                          </div>
                        </div>
                      ))}
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
