import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDoctorAppointments } from '../hooks/useDoctorAppointments';

const DoctorAppointmentsPage = () => {
  const { userProfile } = useAuth();
  const { checkedInAppointments, loading } = useDoctorAppointments(userProfile?.name || '');

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Appointments</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="px-4 py-2">Time</th>
            <th className="px-4 py-2">Patient</th>
            <th className="px-4 py-2">Treatment</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {checkedInAppointments.map((appt) => (
            <tr key={appt.id} className="border-t">
              <td className="px-4 py-2">{appt.time || appt.date}</td>
              <td className="px-4 py-2">{appt.patient?.name || '-'}</td>
              <td className="px-4 py-2">{appt.treatment || '-'}</td>
              <td className="px-4 py-2">{appt.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DoctorAppointmentsPage; 