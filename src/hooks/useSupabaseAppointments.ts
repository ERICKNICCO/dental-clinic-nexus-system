import { useState, useEffect } from 'react';
import { supabaseAppointmentService } from '../services/supabaseAppointmentService';
import { Appointment } from '../types/appointment';
import { useAuth } from '../contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { isDoctorNameMatch } from '../utils/appointmentFilters';
import { supabasePatientService } from '../services/supabasePatientService';

export const useSupabaseAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  // Move processAppointments outside useEffect so it can be reused
  const processAppointments = async (appointmentsList: Appointment[]) => {
    console.log('🔥 Processing appointments in useSupabaseAppointments:', appointmentsList.length);
    
    // Auto-add checked-in patients if not present
    for (const appointment of appointmentsList) {
      if (appointment.status === 'Checked In' || appointment.status === 'Approved') {
        const patientName = appointment.patient?.name || appointment.patient_name || '';
        const patientPhone = appointment.patient?.phone || appointment.patient_phone || '';
        const patientEmail = appointment.patient?.email || appointment.patient_email || '';
        if (patientName || patientPhone || patientEmail) {
          const existing = await supabasePatientService.getPatientByUniqueFields(patientName, patientPhone, patientEmail);
          if (!existing) {
            // Build patient data from appointment
            const p: any = appointment.patient || {};
            const patientData = {
              patientId: appointment.patientId || appointment.patient_id || '',
              name: patientName,
              email: patientEmail,
              phone: patientPhone,
              dateOfBirth: p.dateOfBirth || '',
              gender: p.gender || '',
              address: p.address || '',
              emergencyContact: p.emergencyContact || '',
              emergencyPhone: p.emergencyPhone || '',
              insurance: appointment.insurance || p.insurance || '',
              lastVisit: '',
              nextAppointment: '',
              patientType: appointment.patientType || p.patientType || 'cash',
            };
            await supabasePatientService.addPatient(patientData);
          }
        }
      }
    }
    
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
      channel = supabaseAppointmentService.subscribeToAppointments(async (appointmentsList) => {
        console.log('🔥 Received appointments from Supabase subscription:', appointmentsList.length);
        await processAppointments(appointmentsList);
      });
    };

    // Initial load with automatic patient creation for approved appointments
    const loadInitialAppointments = async () => {
      try {
        const appointmentsList = await supabaseAppointmentService.getAppointments();
        console.log('🔥 Initial appointments loaded:', appointmentsList.length);
        
        // Auto-add checked-in patients if not present
        await processAppointments(appointmentsList);
        
        // For admin users, automatically process all approved appointments
        if (userProfile?.role === 'admin') {
          console.log('🔥 Admin user detected, processing all existing approved appointments...');
          await supabaseAppointmentService.processAllApprovedAppointments();
          
          // Reload appointments after processing
          const updatedAppointmentsList = await supabaseAppointmentService.getAppointments();
          processAppointments(updatedAppointmentsList);
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

  const processAllApprovedAppointments = async () => {
    try {
      console.log('🔥 Manually processing all approved appointments...');
      await supabaseAppointmentService.processAllApprovedAppointments();
      
      // Reload appointments after processing
      const updatedAppointments = await supabaseAppointmentService.getAppointments();
      processAppointments(updatedAppointments);
    } catch (err) {
      console.error('❌ Error processing all approved appointments:', err);
      setError('Failed to process approved appointments');
    }
  };

  const refreshAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsList = await supabaseAppointmentService.getAppointments();
      await processAppointments(appointmentsList);
      setLoading(false);
    } catch (err) {
      setError('Failed to refresh appointments');
      setLoading(false);
    }
  };

  return {
    appointments,
    loading,
    error,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    processAllApprovedAppointments,
    refreshAppointments,
  };
};
