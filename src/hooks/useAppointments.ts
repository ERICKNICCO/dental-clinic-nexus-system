
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAppointmentService } from '../services/supabaseAppointmentService';
import { Appointment } from '../types/appointment';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  // Helper function to normalize doctor names for comparison
  const normalizeDoctorName = (name: string) => {
    if (!name) return '';
    
    // Remove "Dr." prefix and normalize
    return name.toLowerCase()
      .replace(/^dr\.?\s*/i, '') // Remove "Dr." or "Dr" prefix
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  // Helper function to check if two doctor names match
  const isDoctorNameMatch = (appointmentDoctor: string, userDoctor: string) => {
    const normalizedAppointmentDoctor = normalizeDoctorName(appointmentDoctor);
    const normalizedUserDoctor = normalizeDoctorName(userDoctor);
    
    console.log('Comparing normalized names:', normalizedAppointmentDoctor, 'vs', normalizedUserDoctor);
    
    // Exact match
    if (normalizedAppointmentDoctor === normalizedUserDoctor) {
      console.log('Exact match found');
      return true;
    }
    
    // Split both names into words for better matching
    const appointmentWords = normalizedAppointmentDoctor.split(' ').filter(word => word.length > 0);
    const userWords = normalizedUserDoctor.split(' ').filter(word => word.length > 0);
    
    console.log('Appointment words:', appointmentWords);
    console.log('User words:', userWords);
    
    // Check if any word from appointment doctor matches any word from user doctor
    for (const appointmentWord of appointmentWords) {
      for (const userWord of userWords) {
        if (appointmentWord === userWord) {
          console.log('Word match found:', appointmentWord, '=', userWord);
          return true;
        }
      }
    }
    
    // Check if appointment doctor contains any user word or vice versa
    for (const appointmentWord of appointmentWords) {
      if (normalizedUserDoctor.includes(appointmentWord)) {
        console.log('Appointment word found in user name:', appointmentWord);
        return true;
      }
    }
    
    for (const userWord of userWords) {
      if (normalizedAppointmentDoctor.includes(userWord)) {
        console.log('User word found in appointment name:', userWord);
        return true;
      }
    }
    
    console.log('No match found');
    return false;
  };

  // Filter appointments based on user role
  const filterAppointments = (allAppointments: Appointment[]) => {
    if (!userProfile) return allAppointments;

    if (userProfile.role === 'doctor') {
      const filtered = allAppointments.filter((appt) => {
        const appointmentDoctor = appt.dentist || '';
        const userDoctor = userProfile.name || '';
        
        console.log('useAppointments filtering - Appointment doctor:', appointmentDoctor);
        console.log('useAppointments filtering - User doctor:', userDoctor);
        
        const isDoctorMatch = isDoctorNameMatch(appointmentDoctor, userDoctor);
        const isValidStatus = ['Approved', 'Confirmed', 'Checked In', 'In Progress'].includes(appt.status);
        
        console.log('Doctor match:', isDoctorMatch, 'Status valid:', isValidStatus, 'Status:', appt.status);
        
        return isValidStatus && isDoctorMatch;
      });
      
      console.log('useAppointments filtered appointments for doctor:', filtered);
      return filtered;
    }
    
    return allAppointments; // Admin and other roles see all
  };

  useEffect(() => {
    if (!userProfile) return;

    console.log('Setting up appointments subscription for user:', userProfile);
    setLoading(true);
    
    let isSubscribed = true; // Flag to prevent state updates after cleanup

    // Subscribe to real-time updates
    const unsubscribe = supabaseAppointmentService.subscribeToAppointments((allAppointments) => {
      if (!isSubscribed) return; // Prevent updates if component unmounted
      
      console.log('Received real-time appointments update:', allAppointments);
      
      const filteredAppointments = filterAppointments(allAppointments);
      console.log('Filtered appointments after real-time update:', filteredAppointments);
      
      setAppointments(filteredAppointments);
      setLoading(false);
      setError(null);
    });

    return () => {
      console.log('Cleaning up appointments subscription');
      isSubscribed = false; // Prevent any further state updates
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userProfile?.role, userProfile?.name]);

  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    try {
      console.log('Adding new appointment:', appointment);
      const newAppointment = await supabaseAppointmentService.addAppointment(appointment);
      console.log('Appointment added successfully:', newAppointment);
      // Note: Real-time subscription will automatically update the list
      return newAppointment;
    } catch (err) {
      console.error('Error adding appointment:', err);
      setError('Failed to create appointment');
      throw err;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      console.log("🔥🔥 [useAppointments] updateAppointment called!", { id, updates });
      const updatedAppointment = await supabaseAppointmentService.updateAppointment(id, updates);
      console.log('Appointment updated successfully:', updatedAppointment);
      // Note: Real-time subscription will automatically update the list
      return updatedAppointment;
    } catch (err) {
      console.error("🔥🔥 [useAppointments] ERROR during updateAppointment:", err);
      setError('Failed to update appointment');
      throw err;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      console.log('Deleting appointment:', id);
      await supabaseAppointmentService.deleteAppointment(id);
      console.log('Appointment deleted successfully');
      // Note: Real-time subscription will automatically update the list
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
    deleteAppointment,
  };
};
