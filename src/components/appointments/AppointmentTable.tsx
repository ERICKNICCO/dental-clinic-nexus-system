import React from 'react';
import AppointmentRow from './AppointmentRow';
import { Appointment } from '../../types/appointment';
import { getStatusClass } from './appointmentUtils';
import { Button } from '../ui/button';
import { Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AppointmentTableProps {
  appointments: Appointment[];
  onEditAppointment: (appointment: Appointment) => void;
  onApproveAppointment: (id: string) => void;
  onConfirmAppointment: (id: string) => void;
  onProcessApprovedAppointments?: () => void;
  onDeleteAppointment: (id: string) => void;
}

const AppointmentTable: React.FC<AppointmentTableProps> = ({
  appointments,
  onEditAppointment,
  onApproveAppointment,
  onConfirmAppointment,
  onProcessApprovedAppointments,
  onDeleteAppointment
}) => {
  const { userProfile } = useAuth();
  const approvedAppointments = appointments.filter(apt => apt.status === 'Approved');

  return (
    <div className="space-y-4">
      {userProfile?.role === 'admin' && approvedAppointments.length > 0 && onProcessApprovedAppointments && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  Patient Registration Required
                </h3>
                <p className="text-sm text-blue-700">
                  {approvedAppointments.length} approved appointments need patients to be registered
                </p>
              </div>
            </div>
            <Button
              onClick={onProcessApprovedAppointments}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              Add Patients to List
            </Button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treatment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dentist</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  onEdit={onEditAppointment}
                  onApprove={onApproveAppointment}
                  onConfirm={onConfirmAppointment}
                  getStatusClass={getStatusClass}
                  onDelete={onDeleteAppointment}
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No appointments found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentTable;
