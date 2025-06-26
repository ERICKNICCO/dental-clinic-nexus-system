
import { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import { Appointment } from '../types/appointment';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getTodayString, isDoctorNameMatch } from '../utils/appointmentFilters';

export const useDoctorAppointments = (doctorName: string) => {
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [checkedInAppointments, setCheckedInAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorName) {
      setLoading(false);
      return;
    }

    console.log('🔥 Setting up doctor appointments subscription for:', doctorName);
    let channel: RealtimeChannel | null = null;

    const processAppointments = (appointments: Appointment[]) => {
      try {
        const today = getTodayString();
        
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
          
          // Check if appointment matches doctor using the shared utility
          const isDoctorMatch = isDoctorNameMatch(appointmentDoctor, doctorName);
          
          console.log('🔥 Filtering appointment:', {
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
