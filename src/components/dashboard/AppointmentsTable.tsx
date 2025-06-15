
import React, { useMemo, useEffect, useState } from 'react';
import { Clock, User, Stethoscope } from 'lucide-react';
import { Appointment } from '../../types/appointment';
import { useAppointments } from '../../hooks/useAppointments';

const AppointmentsTable = () => {
  const { appointments, loading } = useAppointments();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Update current date every minute to ensure real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => {
    return currentDate.toISOString().split('T')[0];
  }, [currentDate]);

  // Filter appointments for today only
  const todaysAppointments = useMemo(() => {
    console.log('🔍 Filtering appointments for today:', today);
    console.log('🔍 All appointments:', appointments);
    
    const filtered = appointments.filter(appointment => {
      const appointmentDate = appointment.date;
      console.log('🔍 Comparing:', appointmentDate, 'with', today);
      return appointmentDate === today && 
             (appointment.status === 'Confirmed' || appointment.status === 'Approved');
    });
    
    console.log('🔍 Today\'s appointments:', filtered);
    return filtered;
  }, [appointments, today]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Appointments</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dental-600"></div>
          <span className="ml-2">Loading appointments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Today's Appointments</h3>
        <span className="text-sm text-gray-500">
          {currentDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
      </div>
      
      {todaysAppointments.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No appointments scheduled for today</p>
          <p className="text-sm text-gray-400 mt-1">
            {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {todaysAppointments.map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-dental-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {appointment.patient.initials || appointment.patient.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{appointment.patient.name}</p>
                  <p className="text-sm text-gray-600">{appointment.treatment}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4 mr-1" />
                  {appointment.time}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Stethoscope className="w-4 h-4 mr-1" />
                  {appointment.dentist}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsTable;
