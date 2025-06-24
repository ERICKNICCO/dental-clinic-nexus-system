
import { useState, useEffect } from 'react';
import { supabaseAppointmentService } from '../services/supabaseAppointmentService';
import { Appointment } from '../types/appointment';
import { useAuth } from '../contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useSupabaseAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile) return;

    console.log('Setting up Supabase appointments subscription...');
    setLoading(true);

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      channel = supabaseAppointmentService.subscribeToAppointments((appointmentsList) => {
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
    };

    // Initial load
    const loadInitialAppointments = async () => {
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
        
        // Setup subscription after initial load
        setupSubscription();
      } catch (err) {
        console.error('Error loading appointments:', err);
        setError('Failed to load appointments');
        setLoading(false);
      }
    };

    loadInitialAppointments();

    return () => {
      console.log('Cleaning up Supabase appointments subscription');
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    };
  }, [userProfile?.role, userProfile?.name]);

  const addAppointment = async (appointmentData: Omit<Appointment, 'id'>) => {
    try {
      console.log('Adding appointment:', appointmentData);
      await supabaseAppointmentService.addAppointment(appointmentData);
      // Note: The subscription will automatically update the appointments list
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
      // Note: The subscription will automatically update the appointments list
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
      // Note: The subscription will automatically update the appointments list
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
