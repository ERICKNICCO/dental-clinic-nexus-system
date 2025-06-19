
import { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import { Appointment } from '../types/appointment';

export const useDoctorAppointments = (doctorName: string) => {
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [checkedInAppointments, setCheckedInAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorName) return;

    const unsubscribe = appointmentService.subscribeToAppointments((appointments) => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        console.log('Doctor name for filtering:', doctorName);
        console.log('All appointments:', appointments);
        
        // More flexible doctor name matching
        const doctorTodayAppointments = appointments.filter(appointment => {
          const appointmentDoctor = appointment.dentist?.toLowerCase() || '';
          const searchDoctor = doctorName.toLowerCase();
          
          console.log('Comparing:', appointmentDoctor, 'with', searchDoctor);
          
          // Check if appointment is for today and matches doctor
          const isToday = appointment.date === today;
          const isDoctorMatch = appointmentDoctor.includes(searchDoctor) || 
                               searchDoctor.includes(appointmentDoctor) ||
                               appointmentDoctor === searchDoctor;
          
          console.log('Date match:', isToday, 'Doctor match:', isDoctorMatch);
          
          return isToday && isDoctorMatch;
        });
        
        console.log('Filtered appointments for doctor:', doctorTodayAppointments);
        
        // Separate checked in appointments
        const checkedIn = doctorTodayAppointments.filter(
          appointment => appointment.status === 'Checked In'
        );
        
        setTodaysAppointments(doctorTodayAppointments);
        setCheckedInAppointments(checkedIn);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error processing doctor appointments:', err);
        setError('Failed to load appointments');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [doctorName]);

  const checkInPatient = async (appointmentId: string) => {
    try {
      await appointmentService.checkInPatient(appointmentId);
    } catch (err) {
      console.error('Error checking in patient:', err);
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
