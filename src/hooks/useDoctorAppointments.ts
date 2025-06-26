
import { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import { Appointment } from '../types/appointment';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useDoctorAppointments = (doctorName: string) => {
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [checkedInAppointments, setCheckedInAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to normalize doctor names for comparison
  const normalizeDoctorName = (name: string) => {
    if (!name) return '';
    return name.toLowerCase()
      .replace(/^dr\.?\s*/i, '') // Remove "Dr." or "Dr" prefix
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  // Helper function to check if two doctor names match
  const isDoctorNameMatch = (appointmentDoctor: string, userDoctor: string) => {
    const normalizedAppointmentDoctor = normalizeDoctorName(appointmentDoctor);
    const normalizedUserDoctor = normalizeDoctorName(userDoctor);
    
    console.log('Comparing doctors:', {
      appointment: appointmentDoctor,
      normalized_appointment: normalizedAppointmentDoctor,
      user: userDoctor,
      normalized_user: normalizedUserDoctor
    });
    
    // Exact match after normalization
    if (normalizedAppointmentDoctor === normalizedUserDoctor) {
      return true;
    }
    
    // Split both names into words for better matching
    const appointmentWords = normalizedAppointmentDoctor.split(' ').filter(word => word.length > 0);
    const userWords = normalizedUserDoctor.split(' ').filter(word => word.length > 0);
    
    // Check if any word from appointment doctor matches any word from user doctor
    for (const appointmentWord of appointmentWords) {
      for (const userWord of userWords) {
        if (appointmentWord === userWord && appointmentWord.length > 2) { // Only match meaningful words
          console.log('Found word match:', appointmentWord);
          return true;
        }
      }
    }
    
    // Check if appointment doctor contains any significant user word or vice versa
    for (const appointmentWord of appointmentWords) {
      if (appointmentWord.length > 2 && normalizedUserDoctor.includes(appointmentWord)) {
        console.log('Found substring match (appointment in user):', appointmentWord);
        return true;
      }
    }
    
    for (const userWord of userWords) {
      if (userWord.length > 2 && normalizedAppointmentDoctor.includes(userWord)) {
        console.log('Found substring match (user in appointment):', userWord);
        return true;
      }
    }
    
    return false;
  };

  useEffect(() => {
    if (!doctorName) {
      setLoading(false);
      return;
    }

    console.log('🔥 Setting up doctor appointments subscription for:', doctorName);
    let channel: RealtimeChannel | null = null;

    const processAppointments = (appointments: Appointment[]) => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        console.log('🔥 Processing appointments for doctor:', doctorName);
        console.log('🔥 Today\'s date:', today);
        console.log('🔥 Total appointments received:', appointments.length);
        
        // Log all appointments for debugging
        appointments.forEach((apt, index) => {
          console.log(`Appointment ${index + 1}:`, {
            id: apt.id,
            date: apt.date,
            dentist: apt.dentist,
            patient_name: apt.patient?.name || apt.patient_name,
            status: apt.status
          });
        });
        
        // Filter appointments for today and for this doctor
        const doctorTodayAppointments = appointments.filter(appointment => {
          const appointmentDoctor = appointment.dentist || '';
          
          // Check if appointment is for today
          const isToday = appointment.date === today;
          
          // Check if appointment matches doctor
          const isDoctorMatch = isDoctorNameMatch(appointmentDoctor, doctorName);
          
          console.log('Filtering appointment:', {
            id: appointment.id,
            date: appointment.date,
            dentist: appointmentDoctor,
            isToday,
            isDoctorMatch,
            status: appointment.status
          });
          
          return isToday && isDoctorMatch;
        });
        
        console.log('🔥 Filtered appointments for doctor today:', doctorTodayAppointments.length);
        
        // Separate checked in appointments
        const checkedIn = doctorTodayAppointments.filter(
          appointment => appointment.status === 'Checked In'
        );
        
        console.log('🔥 Checked in appointments:', checkedIn.length);
        
        setTodaysAppointments(doctorTodayAppointments);
        setCheckedInAppointments(checkedIn);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('❌ Error processing doctor appointments:', err);
        setError('Failed to load appointments');
        setLoading(false);
      }
    };

    // Set up real-time subscription
    channel = appointmentService.subscribeToAppointments((appointments) => {
      console.log('🔥 Received real-time appointment update');
      processAppointments(appointments);
    });

    return () => {
      console.log('🔥 Cleaning up doctor appointments subscription');
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    };
  }, [doctorName]);

  const checkInPatient = async (appointmentId: string) => {
    try {
      console.log('🔥 Checking in patient for appointment:', appointmentId);
      await appointmentService.checkInPatient(appointmentId);
      console.log('✅ Patient checked in successfully');
    } catch (err) {
      console.error('❌ Error checking in patient:', err);
      setError('Failed to check in patient');
      throw err;
    }
  };

  return {
    todaysAppointments,
    checkedInAppointments,
    loading,
    error,
    checkInPatient
  };
};
