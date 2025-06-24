import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppointmentModal from './AppointmentModal';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useAppointments } from '../../hooks/useAppointments';
import { usePatients } from '../../hooks/usePatients';
import { useAuth } from '../../contexts/AuthContext';
import { Check, Trash2, User } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { isAppointmentToday, isDoctorNameMatch, normalizeDoctorName, getTodayString } from '../../utils/appointmentFilters';

const AppointmentsTable: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const { appointments, loading, updateAppointment, deleteAppointment } = useAppointments();
  const { patients, addPatient } = usePatients();
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
      console.log('Accepting appointment:', appointment);
      
      // Check if patient already exists
      const existingPatient = patients.find(p => 
        p.name.toLowerCase() === appointment.patient.name.toLowerCase() ||
        p.email.toLowerCase() === (appointment.patient.email || '').toLowerCase()
      );
      
      let patientId = existingPatient?.id;
      
      // If patient doesn't exist, create new patient
      if (!existingPatient) {
        console.log('Creating new patient from appointment');
        
        const newPatientData = {
          name: appointment.patient.name,
          email: appointment.patient.email || '',
          phone: appointment.patient.phone || '',
          dateOfBirth: '', // Will need to be filled later
          gender: '', // Will need to be filled later
          address: '', // Will need to be filled later
          emergencyContact: '',
          emergencyPhone: '',
          insurance: '',
          patientType: 'cash' as const
        };
        
        await addPatient(newPatientData);
        
        // Wait a moment for the patient to be added and then find them
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find the newly created patient by checking the updated patients list
        const updatedPatient = patients.find(p => 
          p.name.toLowerCase() === appointment.patient.name.toLowerCase() &&
          p.email.toLowerCase() === (appointment.patient.email || '').toLowerCase()
        );
        
        if (updatedPatient) {
          patientId = updatedPatient.id;
          console.log('Found newly created patient with ID:', patientId);
        } else {
          // If still not found, try to find by name only
          const patientByName = patients.find(p => 
            p.name.toLowerCase() === appointment.patient.name.toLowerCase()
          );
          if (patientByName) {
            patientId = patientByName.id;
            console.log('Found patient by name with ID:', patientId);
          }
        }
        
        toast({
          title: "Patient Registered",
          description: `${appointment.patient.name} has been registered as a new patient`,
        });
      } else {
        console.log('Using existing patient with ID:', patientId);
      }
      
      // Update appointment status to "Checked In"
      await updateAppointment(appointment.id, { 
        status: 'Checked In'
      });
      
      toast({
        title: "Appointment Accepted",
        description: `Appointment for ${appointment.patient.name} has been accepted`,
      });
      
      // Navigate to consultation page if we have a patient ID
      if (patientId) {
        console.log('Navigating to patient file with ID:', patientId);
        navigate(`/patients/${patientId}`);
      } else {
        console.error('Could not determine patient ID for navigation');
        toast({
          title: "Navigation Error",
          description: "Patient was processed but navigation failed. Please find the patient in the Patients section.",
          variant: "destructive",
        });
        // Navigate to patients list as fallback
        navigate('/patients');
      }
      
    } catch (error) {
      console.error('Error accepting appointment:', error);
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
      p.name.toLowerCase() === appointment.patient.name.toLowerCase()
    );
    
    if (existingPatient) {
      navigate(`/patients/${existingPatient.id}`);
    } else {
      toast({
        title: "Patient Not Found",
        description: "Could not find patient record. Please check the Patients section.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = async (appointmentId) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await deleteAppointment(appointmentId);
        console.log('Appointment deleted successfully');
        toast({
          title: "Appointment Deleted",
          description: "The appointment has been successfully deleted",
        });
      } catch (error) {
        console.error('Error deleting appointment:', error);
        toast({
          title: "Error",
          description: "Failed to delete appointment",
          variant: "destructive",
        });
      }
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
              onClick={handleNewAppointment}
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
                          <AvatarImage src={appointment.patient.image} alt={appointment.patient.name} />
                          <AvatarFallback className="text-xs">{appointment.patient.initials || 'U'}</AvatarFallback>
                        </Avatar>
                        <span>{appointment.patient.name}</span>
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
                        // Admin/Staff view: Edit/Delete buttons
                        <>
                          <button 
                            className="text-dental-600 hover:text-dental-900 mr-2"
                            onClick={() => handleEditClick(appointment)}
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
          onClose={handleModalClose}
          appointment={selectedAppointment}
        />
      )}
    </>
  );
};

export default AppointmentsTable;
