import React, { useState } from 'react';
import { Check, Mail } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Appointment } from '../../types/appointment';
import ReceiptModal from './ReceiptModal';
import { useAuth } from '../../contexts/AuthContext';

interface AppointmentRowProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onApprove: (id: string) => void;
  onConfirm: (id: string) => void;
  getStatusClass: (status: string) => string;
  onDelete: (id: string) => void;
}

const AppointmentRow: React.FC<AppointmentRowProps> = ({
  appointment,
  onEdit,
  onApprove,
  onConfirm,
  getStatusClass,
  onDelete
}) => {
  // Add null checks for patient data
  const patientName = appointment.patient?.name || 'Unknown Patient';
  const patientImage = appointment.patient?.image || '';
  const patientPhone = appointment.patient?.phone || 'No phone';
  const patientInitials = appointment.patient?.initials || 'U';
  const treatmentName = appointment.treatment || 'No treatment';
  const dentistName = appointment.dentist || 'No dentist';
  const appointmentStatus = appointment.status || 'Pending';
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const { userProfile } = useAuth();
  const isDoctor = userProfile?.role === 'doctor';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{appointment.date}</div>
        <div className="text-sm text-gray-500">{appointment.time}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Avatar className="w-8 h-8 mr-2">
            <AvatarImage src={patientImage} alt={patientName} />
            <AvatarFallback className="text-xs">{patientInitials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-gray-900">{patientName}</div>
            <div className="text-sm text-gray-500">{patientPhone}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{treatmentName}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dentistName}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(appointmentStatus)}`}>
          {appointmentStatus}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex space-x-2">
          {/* Doctor: Hide check and delete for Confirmed, show check for Approved */}
          {isDoctor ? (
            <>
              <button 
                className="text-dental-600 hover:text-dental-900" 
                title="Edit"
                onClick={() => onEdit(appointment)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              {appointmentStatus === 'Approved' && (
                <button 
                  className="text-green-600 hover:text-green-900" 
                  title="Proceed to Patient File"
                  onClick={() => onApprove(appointment.id)}
                >
                  <Check className="h-5 w-5" />
                </button>
              )}
              {appointmentStatus === 'Completed' && appointment.patientType === 'cash' && (
                <button
                  className="text-green-700 hover:text-green-900"
                  title="Print Receipt"
                  onClick={() => setIsReceiptOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m4 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10m16 0a2 2 0 01-2 2H7a2 2 0 01-2-2m16 0H5" />
                  </svg>
                </button>
              )}
            </>
          ) : (
            <>
              <button 
                className="text-dental-600 hover:text-dental-900" 
                title="Edit"
                onClick={() => onEdit(appointment)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              {appointmentStatus === 'Pending' && (
                <button 
                  className="text-green-600 hover:text-green-900" 
                  title="Approve"
                  onClick={() => onApprove(appointment.id)}
                >
                  <Check className="h-5 w-5" />
                </button>
              )}
              {appointmentStatus === 'Approved' && (
                <button 
                  className="text-blue-600 hover:text-blue-900" 
                  title="Confirm & Send Email"
                  onClick={() => onConfirm(appointment.id)}
                >
                  <Mail className="h-5 w-5" />
                </button>
              )}
              {appointmentStatus === 'Completed' && appointment.patientType === 'cash' && (
                <button
                  className="text-green-700 hover:text-green-900"
                  title="Print Receipt"
                  onClick={() => setIsReceiptOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m4 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10m16 0a2 2 0 01-2 2H7a2 2 0 01-2-2m16 0H5" />
                  </svg>
                </button>
              )}
              {appointmentStatus !== 'Confirmed' && (
                <button className="text-red-600 hover:text-red-900" title="Delete" onClick={() => onDelete(appointment.id)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
        {isReceiptOpen && (
          <ReceiptModal
            isOpen={isReceiptOpen}
            onClose={() => setIsReceiptOpen(false)}
            appointment={appointment}
          />
        )}
      </td>
    </tr>
  );
};

export default AppointmentRow;
