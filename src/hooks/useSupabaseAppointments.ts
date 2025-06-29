import { useState, useEffect } from 'react';
import { supabaseAppointmentService } from '../services/supabaseAppointmentService';
import { Appointment } from '../types/appointment';
import { useAuth } from '../contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { isDoctorNameMatch } from '../utils/appointmentFilters';

export const useSupabaseAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  // Move processAppointments outside useEffect so it can be reused
  const processAppointments = (appointmentsList: Appointment[]) => {
    console.log('🔥 Processing appointments in useSupabaseAppointments:', appointmentsList.length);
    
    // Filter appointments based on user role
    let filteredAppointments = appointmentsList;
    if (userProfile?.role === 'doctor') {
      console.log('🔥 Filtering appointments for doctor:', userProfile.name);
      
      filteredAppointments = appointmentsList.filter(appointment => {
        const appointmentDoctor = appointment.dentist || '';
        const userDoctor = userProfile.name || '';
        
        const isDoctorMatch = isDoctorNameMatch(appointmentDoctor, userDoctor);
        
        console.log('🔥 useSupabaseAppointments filtering - Appointment doctor:', appointmentDoctor);
        console.log('🔥 useSupabaseAppointments filtering - User doctor:', userDoctor);
        console.log('🔥 useSupabaseAppointments filtering - Match result:', isDoctorMatch);
        
        return isDoctorMatch;
      });
      
      console.log('🔥 Filtered appointments for doctor:', filteredAppointments.length);
    }
    
    setAppointments(filteredAppointments);
    setLoading(false);
    setError(null);
  };

  useEffect(() => {
    if (!userProfile) return;

    console.log('🔥 Setting up Supabase appointments subscription for user:', userProfile.name);
    setLoading(true);

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      channel = supabaseAppointmentService.subscribeToAppointments((appointmentsList) => {
        console.log('🔥 Received appointments from Supabase subscription:', appointmentsList.length);
        processAppointments(appointmentsList);
      });
    };

    // Initial load
    const loadInitialAppointments = async () => {
      try {
        const appointmentsList = await supabaseAppointmentService.getAppointments();
        console.log('🔥 Initial appointments loaded:', appointmentsList.length);
        
        // Process existing approved appointments that might not have patients created
        if (userProfile?.role === 'admin') {
          console.log('🔥 Admin user detected, processing existing approved appointments...');
          await supabaseAppointmentService.processExistingApprovedAppointments();
          
          // Reload appointments after processing
          const updatedAppointmentsList = await supabaseAppointmentService.getAppointments();
          processAppointments(updatedAppointmentsList);
        } else {
          processAppointments(appointmentsList);
        }
        
        // Setup subscription after initial load
        setupSubscription();
      } catch (err) {
        console.error('❌ Error loading appointments:', err);
        setError('Failed to load appointments');
        setLoading(false);
      }
    };

    loadInitialAppointments();

    return () => {
      console.log('🔥 Cleaning up Supabase appointments subscription');
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
      console.log('🔥 useSupabaseAppointments: Updating appointment:', id, updates);
      
      // If updating status to 'Approved', the service will automatically create the patient
      await supabaseAppointmentService.updateAppointment(id, updates);
      
      console.log('✅ useSupabaseAppointments: Appointment updated successfully');
      // Note: The subscription will automatically update the appointments list
    } catch (err) {
      console.error('❌ useSupabaseAppointments: Error updating appointment:', err);
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

  const processExistingApprovedAppointments = async () => {
    try {
      console.log('🔥 Manually processing existing approved appointments...');
      await supabaseAppointmentService.processExistingApprovedAppointments();
      
      // Reload appointments after processing
      const updatedAppointments = await supabaseAppointmentService.getAppointments();
      processAppointments(updatedAppointments);
    } catch (err) {
      console.error('❌ Error processing existing approved appointments:', err);
      setError('Failed to process existing appointments');
    }
  };

  return {
    appointments,
    loading,
    error,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    processExistingApprovedAppointments
  };
};
