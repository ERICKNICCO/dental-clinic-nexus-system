
import { supabase } from '../integrations/supabase/client';

export interface PublicAppointmentData {
  fullName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  doctor: string;
  message?: string;
}

export const publicAppointmentService = {
  async bookAppointment(appointmentData: PublicAppointmentData) {
    console.log('🔥 PublicAppointmentService: Booking appointment:', appointmentData);
    
    try {
      // Call the edge function to book the appointment
      const { data, error } = await supabase.functions.invoke('book-appointment', {
        body: appointmentData
      });

      if (error) {
        console.error('❌ Error booking appointment:', error);
        throw new Error('Failed to book appointment. Please try again.');
      }

      console.log('✅ Appointment booked successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ PublicAppointmentService error:', error);
      throw error;
    }
  },

  async checkAvailability(date: string, time: string, doctor: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id')
        .eq('date', date)
        .eq('time', time)
        .eq('dentist', doctor);

      if (error) {
        console.error('❌ Error checking availability:', error);
        return false;
      }

      // If no appointments found, slot is available
      return data.length === 0;
    } catch (error) {
      console.error('❌ Error checking availability:', error);
      return false;
    }
  }
};
