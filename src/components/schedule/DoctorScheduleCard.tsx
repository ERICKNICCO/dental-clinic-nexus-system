
import React from 'react';
import { WeeklySchedule } from '../../types/schedule';

interface DoctorScheduleCardProps {
  doctorSchedule: WeeklySchedule;
}

const DoctorScheduleCard: React.FC<DoctorScheduleCardProps> = ({ doctorSchedule }) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <img 
          src={doctorSchedule.doctorImage} 
          alt={doctorSchedule.doctorName} 
          className="w-12 h-12 rounded-full mr-4"
        />
        <h3 className="text-lg font-semibold text-gray-900">{doctorSchedule.doctorName}</h3>
      </div>
      
      <div className="space-y-3">
        {daysOfWeek.map(day => {
          const daySchedule = doctorSchedule.schedule[day];
          
          return (
            <div key={day} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <span className="font-medium text-gray-700 w-20">{day.slice(0, 3)}</span>
              
              {daySchedule?.isAvailable ? (
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">
                    {formatTime(daySchedule.startTime)} - {formatTime(daySchedule.endTime)}
                  </span>
                  <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Available
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">
                    {daySchedule?.specialNotes || 'Not Available'}
                  </span>
                  <span className="ml-3 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    Off
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DoctorScheduleCard;
