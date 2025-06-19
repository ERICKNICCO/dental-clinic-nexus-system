import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDoctorAppointments } from '../../hooks/useDoctorAppointments';
import { useAppointments } from '../../hooks/useAppointments';

interface Patient {
  id: number;
  name: string;
  image: string;
  treatment: string;
  date: string;
}

const RecentPatients: React.FC = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';
  const isDoctor = userProfile?.role === 'doctor';

  // For admin, use all appointments; for doctor, use only their appointments
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { todaysAppointments, loading: doctorLoading } = useDoctorAppointments(userProfile?.name || '');
  const loading = isAdmin ? appointmentsLoading : doctorLoading;

  // Helper to check if an appointment is today
  const isToday = (dateStr: string) => {
    const today = new Date();
    const date = new Date(dateStr);
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // Get today's appointments for admin or doctor
  const todays = isAdmin
    ? appointments.filter((appt) => isToday(appt.date))
    : todaysAppointments;

  // Convert appointments to recent patients format
  const getRecentPatients = (): Patient[] => {
    if (!todays || todays.length === 0) return [];
    // Get unique patients from recent appointments (last 5)
    const uniquePatients = new Map();
    // Sort appointments by date (newest first) and get unique patients
    const sortedAppointments = [...todays]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sortedAppointments.forEach((appointment, index) => {
      if (!uniquePatients.has(appointment.patient.name) && uniquePatients.size < 5) {
        uniquePatients.set(appointment.patient.name, {
          id: index + 1,
          name: appointment.patient.name,
          image: appointment.patient.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patient.name)}&background=random`,
          treatment: appointment.treatment,
          date: new Date(appointment.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
    });
    return Array.from(uniquePatients.values());
  };

  const patients = getRecentPatients();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-full">
        <h2 className="text-lg font-semibold mb-4">Recent Patients</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <h2 className="text-lg font-semibold mb-4">Recent Patients</h2>
      <div className="space-y-4">
        {patients.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No recent patients found</p>
            <p className="text-sm">Patients will appear here after appointments</p>
          </div>
        ) : (
          patients.map((patient) => (
            <div key={patient.id} className="flex items-center">
              <img 
                className="w-10 h-10 rounded-full mr-3" 
                src={patient.image} 
                alt={patient.name}
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`;
                }}
              />
              <div>
                <p className="font-medium">{patient.name}</p>
                <p className="text-sm text-gray-500">{patient.treatment} - {patient.date}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentPatients;
