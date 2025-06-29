
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppointmentModal from './AppointmentModal';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useSupabaseAppointments } from '../../hooks/useSupabaseAppointments';
import { useSupabasePatients } from '../../hooks/useSupabasePatients';
import { useAuth } from '../../contexts/AuthContext';
import { Check, Trash2, User } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { isAppointmentToday, isDoctorNameMatch, normalizeDoctorName, getTodayString } from '../../utils/appointmentFilters';
import { supabase } from '../../integrations/supabase/client';

const AppointmentsTable: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const { appointments, loading, updateAppointment, deleteAppointment } = useSupabaseAppointments();
  const { patients, addPatient, loading: patientsLoading, refreshPatients } = useSupabasePatients();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const todayString = getTodayString();
  
  console.log('Today\'s date for filtering:', todayString);
  console.log('All appointments loaded:', appointments);
  console.log('User profile:', userProfile);

  // Filter appointments for today and for the current doctor if they are a doctor
  // Include "Checked In" and "In Progress" appointments so they remain visible until checkout is complete
  const todaysAppointments = appointments.filter(appointment => {
    console.log('Checking appointment:', appointment);
    console.log('Appointment date:', appointment.date);
    
    const isToday = isAppointmentToday(appointment.date);
    
    // If user is a doctor, also filter by doctor name
    if (userProfile?.role === 'doctor') {
      const appointmentDoctor = appointment.dentist || '';
      const userDoctor = userProfile.name || '';
      
      console.log('Doctor filtering - Appointment doctor:', appointmentDoctor);
      console.log('Doctor filtering - User doctor:', userDoctor);
      
      const isDoctorMatch = isDoctorNameMatch(appointmentDoctor, userDoctor);
      
      // Show appointments that are: Approved, Confirmed, Checked In, or In Progress
      // This ensures patients remain visible until consultation is fully completed
      const isValidStatus = ['Approved', 'Confirmed', 'Checked In', 'In Progress'].includes(appointment.status);
      
      console.log('Date match:', isToday, 'Doctor match:', isDoctorMatch, 'Valid status:', isValidStatus, 'Status:', appointment.status);
      
      return isToday && isDoctorMatch && isValidStatus;
    }
    
    return isToday;
  }).slice(0, 5); // Show only first 5 for dashboard

  console.log('Filtered today\'s appointments:', todaysAppointments);

  const handleAcceptAppointment = async (appointment) => {
    try {
      console.log('🔥 Accepting appointment:', appointment);
      
      // Wait for patients to load if they're still loading
      if (patientsLoading) {
        toast({
          title: "Loading...",
          description: "Please wait while we load patient data",
        });
        return;
      }

      // Check if patient already exists by name, phone, or email
      const existingPatient = patients.find(p => {
        const nameMatch = p.name.toLowerCase().trim() === (appointment.patient?.name || appointment.patient_name || '').toLowerCase().trim();
        const phoneMatch = p.phone === (appointment.patient?.phone || appointment.patient_phone || '');
        const emailMatch = p.email && appointment.patient?.email && p.email.toLowerCase() === appointment.patient.email.toLowerCase();
        
        console.log('🔍 Checking patient match:', {
          patientName: p.name,
          appointmentName: appointment.patient?.name || appointment.patient_name,
          nameMatch,
          phoneMatch,
          emailMatch
        });
        
        return nameMatch || phoneMatch || emailMatch;
      });
      
      let finalPatientId = existingPatient?.id;
      
      // If patient doesn't exist, create new patient
      if (!existingPatient) {
        console.log('🔥 Creating new patient from appointment data');
        
        const newPatientData = {
          name: appointment.patient?.name || appointment.patient_name || 'Unknown Patient',
          email: appointment.patient?.email || appointment.patient_email || '',
          phone: appointment.patient?.phone || appointment.patient_phone || '',
          dateOfBirth: '1990-01-01',
          gender: 'Other',
          address: 'To be updated',
          emergencyContact: 'To be updated',
          emergencyPhone: '',
          insurance: appointment.insurance || '',
          patientType: (appointment.patientType || 'cash') as 'cash' | 'insurance',
          lastVisit: new Date().toISOString().split('T')[0],
          nextAppointment: ''
        };
        
        console.log('🔥 New patient data:', newPatientData);
        
        try {
          finalPatientId = await addPatient(newPatientData);
          console.log('✅ Patient created with ID:', finalPatientId);
          
          // Refresh patients list and wait a moment
          await refreshPatients();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          toast({
            title: "Patient Registered",
            description: `${newPatientData.name} has been registered as a new patient`,
          });
          
        } catch (error) {
          console.error('❌ Error creating patient:', error);
          toast({
            title: "Error",
            description: "Failed to create patient record",
            variant: "destructive",
          });
          return;
        }
      } else {
        console.log('✅ Using existing patient with ID:', finalPatientId);
      }
      
      // Update appointment status to "Checked In"
      await updateAppointment(appointment.id, { 
        status: 'Checked In'
      });
      
      toast({
        title: "Appointment Accepted",
        description: `Appointment for ${appointment.patient?.name || appointment.patient_name} has been accepted`,
      });
      
      if (finalPatientId) {
        console.log('✅ Navigating to patient file with ID:', finalPatientId);
        navigate(`/patients/${finalPatientId}/file`);
      } else {
        console.error('❌ Could not determine patient ID for navigation');
        toast({
          title: "Navigation Error", 
          description: "Patient was processed but navigation failed. Please find the patient in the Patients section.",
          variant: "destructive",
        });
        navigate('/patients');
      }
      
    } catch (error) {
      console.error('❌ Error accepting appointment:', error);
      toast({
        title: "Error",
        description: "Failed to accept appointment",
        variant: "destructive",
      });
    }
  };

  const handleContinueConsultation = (appointment) => {
    // Find the patient and navigate to their consultation
    const existingPatient = patients.find(p => 
      p.name.toLowerCase() === (appointment.patient?.name || appointment.patient_name || '').toLowerCase()
    );
    
    if (existingPatient) {
      navigate(`/patients/${existingPatient.id}/file`);
    } else {
      toast({
        title: "Patient Not Found",
        description: "Could not find patient record. Please check the Patients section.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment? This will also delete any associated payment records.')) {
      return;
    }

    try {
      console.log('🔥 Admin attempting to delete appointment:', appointmentId);
      console.log('🔥 User profile:', userProfile);
      
      // First, delete any associated payment records to avoid foreign key constraint violation
      console.log('🔥 Deleting associated payment records...');
      const { error: paymentsDeleteError } = await supabase
        .from('payments')
        .delete()
        .eq('appointment_id', appointmentId);

      if (paymentsDeleteError) {
        console.error('❌ Error deleting payment records:', paymentsDeleteError);
        toast({
          title: "Warning",
          description: "Could not delete associated payment records, but continuing with appointment deletion",
          variant: "destructive",
        });
      } else {
        console.log('✅ Associated payment records deleted successfully');
      }

      // Now delete the appointment
      await deleteAppointment(appointmentId);
      console.log('✅ Appointment deleted successfully by admin');
      
      toast({
        title: "Appointment Deleted",
        description: "The appointment and any associated payment records have been successfully deleted",
      });
    } catch (error) {
      console.error('❌ Error deleting appointment:', error);
      toast({
        title: "Error",
        description: `Failed to delete appointment: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  // For non-doctor users, keep the edit functionality
  const handleEditClick = (appointment) => {
    console.log('Edit clicked for appointment:', appointment);
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Approved':
        return 'bg-blue-100 text-blue-800';
      case 'Checked In':
        return 'bg-purple-100 text-purple-800';
      case 'In Progress':
        return 'bg-orange-100 text-orange-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {userProfile?.role === 'doctor' ? 'My Today\'s Appointments' : 'Today\'s Appointments'}
          </h2>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dental-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {userProfile?.role === 'doctor' ? 'My Today\'s Appointments' : 'Today\'s Appointments'}
          </h2>
          {userProfile?.role !== 'doctor' && (
            <button 
              onClick={() => {
                setSelectedAppointment(null);
                setIsModalOpen(true);
              }}
              className="bg-dental-600 text-white px-4 py-2 rounded-lg hover:bg-dental-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Appointment
            </button>
          )}
        </div>
        
        {todaysAppointments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No appointments scheduled for today</p>
            {userProfile?.role === 'doctor' && (
              <div className="text-xs text-gray-400 mt-2">
                Looking for appointments for {userProfile.name} on {todayString}
                <br />
                Normalized name: "{normalizeDoctorName(userProfile.name || '')}"
                <br />
                Total appointments in system: {appointments.length}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2">
              Today's date: {todayString}
              <br />
              Total appointments: {appointments.length}
              <br />
              Appointments for today (all users): {appointments.filter(apt => isAppointmentToday(apt.date)).length}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treatment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dentist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todaysAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{appointment.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="w-8 h-8 mr-2">
                          <AvatarImage src={appointment.patient?.image} alt={appointment.patient?.name || appointment.patient_name} />
                          <AvatarFallback className="text-xs">{(appointment.patient?.name || appointment.patient_name || 'U').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{appointment.patient?.name || appointment.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{appointment.treatment}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{appointment.dentist}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {userProfile?.role === 'doctor' ? (
                        // Doctor view: Accept/Continue/Delete buttons based on status
                        <>
                          {(appointment.status === 'Approved' || appointment.status === 'Confirmed') && (
                            <button 
                              className="text-green-600 hover:text-green-900 mr-2 p-1 rounded hover:bg-green-50"
                              onClick={() => handleAcceptAppointment(appointment)}
                              title="Accept appointment and start consultation"
                              disabled={patientsLoading}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {(appointment.status === 'Checked In' || appointment.status === 'In Progress') && (
                            <button 
                              className="text-blue-600 hover:text-blue-900 mr-2 p-1 rounded hover:bg-blue-50"
                              onClick={() => handleContinueConsultation(appointment)}
                              title="Continue consultation"
                            >
                              <User className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            onClick={() => handleDeleteClick(appointment.id)}
                            title="Delete appointment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        // Admin/Staff view: Edit/Delete buttons with enhanced permissions
                        <>
                          <button 
                            className="text-dental-600 hover:text-dental-900 mr-2"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsModalOpen(true);
                            }}
                            title="Edit appointment"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(appointment.id)}
                            title="Delete appointment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {userProfile?.role === 'doctor' && (
          <div className="mt-4 text-sm text-gray-600">
            Showing appointments for {userProfile.name} on {todayString}
            <div className="text-xs text-gray-500 mt-1">
              Found {todaysAppointments.length} appointments for today
              <br />
              Searching for normalized name: "{normalizeDoctorName(userProfile.name || '')}"
              <br />
              Total appointments in system: {appointments.length}
              <br />
              <em>Note: Patients remain visible until consultation is completed with checkout</em>
            </div>
          </div>
        )}
      </div>
      
      {userProfile?.role !== 'doctor' && (
        <AppointmentModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
        />
      )}
    </>
  );
};

export default AppointmentsTable;
