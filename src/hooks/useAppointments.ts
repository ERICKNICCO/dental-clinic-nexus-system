
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { appointmentService } from '../services/appointmentService';
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

  useEffect(() => {
    if (!userProfile) return;

    const loadAppointments = async () => {
      try {
        setLoading(true);
        // Always fetch all appointments, then filter locally
        const allAppointments = await appointmentService.getAppointments();

        const filteredAppointments = allAppointments.filter((appt) => {
          if (userProfile.role === 'doctor') {
            // Filter by 'Approved' OR 'Confirmed' status and matching doctor's name using flexible matching
            const appointmentDoctor = appt.dentist || '';
            const userDoctor = userProfile.name || '';
            
            console.log('useAppointments filtering - Appointment doctor:', appointmentDoctor);
            console.log('useAppointments filtering - User doctor:', userDoctor);
            
            const isDoctorMatch = isDoctorNameMatch(appointmentDoctor, userDoctor);
            const isValidStatus = ['Approved', 'Confirmed'].includes(appt.status);
            
            console.log('Doctor match:', isDoctorMatch, 'Status valid:', isValidStatus, 'Status:', appt.status);
            
            return isValidStatus && isDoctorMatch;
          }
          return true; // Admin and other roles see all
        });

        console.log('useAppointments filtered appointments:', filteredAppointments);
        setAppointments(filteredAppointments);
        setError(null);
      } catch (err) {
        setError('Failed to load appointments');
        console.error('Error loading appointments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();

    // Subscribe to real-time updates for all appointments, then filter locally
    const unsubscribe = appointmentService.subscribeToAppointments((allUpdatedAppointments) => {
      const filteredUpdatedAppointments = allUpdatedAppointments.filter((appt) => {
        if (userProfile.role === 'doctor') {
          const appointmentDoctor = appt.dentist || '';
          const userDoctor = userProfile.name || '';
          const isDoctorMatch = isDoctorNameMatch(appointmentDoctor, userDoctor);
          const isValidStatus = ['Approved', 'Confirmed'].includes(appt.status);
          return isValidStatus && isDoctorMatch;
        }
        return true; // Admin and other roles see all
      });
      setAppointments(filteredUpdatedAppointments);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    try {
      const appointmentId = await appointmentService.addAppointment(appointment);
      const newAppointment = {
        ...appointment,
        id: appointmentId
      } as Appointment;
      setAppointments((prev) => [...prev, newAppointment]);
      return newAppointment;
    } catch (err) {
      setError('Failed to create appointment');
      throw err;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      console.log("🔥🔥 [useAppointments] updateAppointment called!", { id, updates });
      await appointmentService.updateAppointment(id, updates);
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, ...updates } : app))
      );
      return { ...updates, id } as Appointment;
    } catch (err) {
      console.error("🔥🔥 [useAppointments] ERROR during updateAppointment:", err);
      setError('Failed to update appointment');
      throw err;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      await appointmentService.deleteAppointment(id);
      setAppointments((prev) => prev.filter((app) => app.id !== id));
    } catch (err) {
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
