
import { Appointment } from '../types/appointment';
import { appointmentCrud } from './supabase/appointmentCrud';
import { appointmentTransformers } from './supabase/appointmentTransformers';
import { appointmentSubscriptions } from './supabase/appointmentSubscriptions';
import { appointmentNotifications } from './supabase/appointmentNotifications';

export const supabaseAppointmentService = {
  // Add appointment and trigger notification
  async addAppointment(appointment: Omit<Appointment, 'id'>): Promise<string> {
    const appointmentId = await appointmentCrud.create(appointment);
    
    // Create notification for the assigned doctor
    await appointmentNotifications.notifyNewAppointment(appointment, appointmentId);

    return appointmentId;
  },

  // Get all appointments
  async getAppointments(): Promise<Appointment[]> {
    return appointmentCrud.getAll();
  },

  // Update appointment
  async updateAppointment(id: string, updates: Partial<Appointment>) {
    const data = await appointmentCrud.update(id, updates);

    // Create notification for status changes
    if (updates.status && ['Approved', 'Cancelled'].includes(updates.status)) {
      await appointmentNotifications.notifyStatusChange(id, updates.status, data.dentist);
    }

    return data;
  },

  // Delete appointment
  async deleteAppointment(id: string) {
    return appointmentCrud.delete(id);
  },

  // Transform Supabase data to app format
  transformFromSupabase: appointmentTransformers.fromSupabase,

  // Subscribe to appointment changes with real-time updates
  subscribeToAppointments: appointmentSubscriptions.subscribeToAppointments,

  // Check in patient
  async checkInPatient(appointmentId: string) {
    return appointmentCrud.checkIn(appointmentId);
  },

  // Row-level subscription for better performance
  subscribeToAppointmentsRowLevel: appointmentSubscriptions.subscribeToAppointmentsRowLevel
};
