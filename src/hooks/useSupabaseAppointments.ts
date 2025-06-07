
import { useState, useEffect } from 'react';
import { supabaseAppointmentService } from '../services/supabaseAppointmentService';
import { Appointment } from '../types/appointment';
import { useAuth } from '../contexts/AuthContext';

export const useSupabaseAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    console.log('Setting up Supabase appointments subscription...');
    setLoading(true);

    const unsubscribe = supabaseAppointmentService.subscribeToAppointments((appointmentsList) => {
      console.log('Received appointments from Supabase:', appointmentsList);
      
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

    // Initial load
    loadAppointments();

    return () => {
      console.log('Cleaning up Supabase appointments subscription');
      unsubscribe();
    };
  }, [userProfile]);

  const loadAppointments = async () => {
    try {
      const appointmentsList = await supabaseAppointmentService.getAppointments();
      
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
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load appointments');
      setLoading(false);
    }
  };

  const addAppointment = async (appointmentData: Omit<Appointment, 'id'>) => {
    try {
      console.log('Adding appointment:', appointmentData);
      await supabaseAppointmentService.addAppointment(appointmentData);
      await loadAppointments(); // Reload to get updated data
    } catch (err) {
      console.error('Error adding appointment:', err);
      setError('Failed to add appointment');
      throw err;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      console.log('Updating appointment:', id, updates);
      await supabaseAppointmentService.updateAppointment(id, updates);
      await loadAppointments(); // Reload to get updated data
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError('Failed to update appointment');
      throw err;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      console.log('Deleting appointment:', id);
      await supabaseAppointmentService.deleteAppointment(id);
      await loadAppointments(); // Reload to get updated data
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
