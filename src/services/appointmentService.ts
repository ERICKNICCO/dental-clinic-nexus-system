
import { supabaseAppointmentService } from './supabaseAppointmentService';
import { Appointment } from '../types/appointment';

export const appointmentService = {
  // Subscribe to appointments using supabase service
  subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
    return supabaseAppointmentService.subscribeToAppointments(callback);
  },

  // Check in patient by updating appointment status
  async checkInPatient(appointmentId: string) {
    try {
      await supabaseAppointmentService.updateAppointment(appointmentId, {
        status: 'Checked In'
      });
      console.log('Patient checked in successfully for appointment:', appointmentId);
    } catch (error) {
      console.error('Error checking in patient:', error);
      throw error;
    }
  }
};
