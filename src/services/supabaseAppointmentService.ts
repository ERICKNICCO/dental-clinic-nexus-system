
import { supabase } from '../integrations/supabase/client';
import { Appointment } from '../types/appointment';
import { appointmentTransformers } from './supabase/appointmentTransformers';
import { appointmentNotifications } from './supabase/appointmentNotifications';

export const supabaseAppointmentService = {
  // Get all appointments
  async getAppointments(): Promise<Appointment[]> {
    console.log('Fetching appointments from Supabase...');
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }

    console.log('Fetched appointments from Supabase:', data);
    return data.map(appointmentTransformers.fromSupabase);
  },

  // Add a new appointment
  async addAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    console.log('Adding appointment to Supabase:', appointment);
    
    const supabaseData = appointmentTransformers.toSupabase(appointment);
    const { data, error } = await supabase
      .from('appointments')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      console.error('Error adding appointment:', error);
      throw error;
    }

    console.log('Added appointment to Supabase:', data);
    const newAppointment = appointmentTransformers.fromSupabase(data);

    // Create notification for new appointment
    try {
      console.log('Creating notification for new appointment...');
      await appointmentNotifications.notifyNewAppointment(appointment, data.id);
      console.log('Notification created successfully');
    } catch (notificationError) {
      console.error('Error creating notification, but appointment was created:', notificationError);
      // Don't throw here to avoid failing the appointment creation
    }

    return newAppointment;
  },

  // Update an appointment
  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    console.log('Updating appointment in Supabase:', id, updates);
    
    const supabaseUpdates = appointmentTransformers.toSupabaseUpdate(updates);
    const { data, error } = await supabase
      .from('appointments')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }

    console.log('Updated appointment in Supabase:', data);
    const updatedAppointment = appointmentTransformers.fromSupabase(data);

    // Create notification for status changes
    if (updates.status && ['Approved', 'Cancelled'].includes(updates.status)) {
      try {
        console.log('Creating notification for status change...');
        await appointmentNotifications.notifyStatusChange(id, updates.status, updatedAppointment.dentist);
        console.log('Status change notification created successfully');
      } catch (notificationError) {
        console.error('Error creating status change notification:', notificationError);
      }
    }

    return updatedAppointment;
  },

  // Delete an appointment
  async deleteAppointment(id: string): Promise<void> {
    console.log('Deleting appointment from Supabase:', id);
    
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }

    console.log('Deleted appointment from Supabase:', id);
  },

  // Subscribe to appointment changes with unique channel names
  subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
    console.log('Setting up appointments subscription');
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const channelName = `appointments_${timestamp}_${randomId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        async (payload) => {
          console.log('Appointments change detected:', payload);
          
          // Fetch all appointments and update the callback
          try {
            const appointments = await this.getAppointments();
            callback(appointments);
          } catch (error) {
            console.error('Error fetching appointments after change:', error);
          }
        }
      )
      .subscribe();

    // Initial fetch
    this.getAppointments()
      .then(callback)
      .catch(error => console.error('Error in initial appointments fetch:', error));

    return () => {
      console.log('Unsubscribing from appointments changes:', channelName);
      supabase.removeChannel(channel);
    };
  },
};
