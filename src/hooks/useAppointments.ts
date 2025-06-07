
import { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import { Appointment } from '../types/appointment';
import { useAuth } from '../contexts/AuthContext';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    console.log('Setting up appointments subscription...');
    setLoading(true);
    
    const unsubscribe = appointmentService.subscribeToAppointments((appointmentsList) => {
      console.log('Received appointments from Firebase:', appointmentsList);
      
      // Filter appointments based on user role
      let filteredAppointments = appointmentsList;
      if (userProfile?.role === 'doctor') {
        filteredAppointments = appointmentsList.filter(
          appointment => appointment.dentist === userProfile.name
        );
      }
      
      setAppointments(filteredAppointments);
      setLoading(false);
      setError(null);
    });

    return () => {
      console.log('Cleaning up appointments subscription');
      unsubscribe();
    };
  }, [userProfile]);

  const addAppointment = async (appointmentData: Omit<Appointment, 'id'>) => {
    try {
      console.log('Adding appointment:', appointmentData);
      await appointmentService.addAppointment(appointmentData);
    } catch (err) {
      console.error('Error adding appointment:', err);
      setError('Failed to add appointment');
      throw err;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      console.log('Updating appointment:', id, updates);
      await appointmentService.updateAppointment(id, updates);
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError('Failed to update appointment');
      throw err;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      console.log('Deleting appointment:', id);
      await appointmentService.deleteAppointment(id);
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError('Failed to delete appointment');
      throw err;
    }
  };

  return {
    appointments,
    loading,
    error,
    addAppointment,
    updateAppointment,
    deleteAppointment
  };
};
