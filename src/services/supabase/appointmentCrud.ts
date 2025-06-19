
import { supabase } from '../../integrations/supabase/client';
import { Appointment } from '../../types/appointment';
import { appointmentTransformers } from './appointmentTransformers';

export const appointmentCrud = {
  // Create appointment
  async create(appointment: Omit<Appointment, 'id'>): Promise<string> {
    console.log('Adding appointment:', appointment);
    
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

    console.log('Appointment added successfully:', data);
    return data.id;
  },

  // Get all appointments
  async getAll(): Promise<Appointment[]> {
    console.log('Fetching appointments from Supabase');
    
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

  // Update appointment
  async update(id: string, updates: Partial<Appointment>) {
    console.log('Updating appointment:', id, updates);
    
    const updateData = appointmentTransformers.toSupabaseUpdate(updates);

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }

    console.log('Appointment updated successfully:', data);
    return data;
  },

  // Delete appointment
  async delete(id: string) {
    console.log('Deleting appointment:', id);
    
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }

    console.log('Appointment deleted successfully');
  },

  // Check in patient
  async checkIn(appointmentId: string) {
    console.log('Checking in patient for appointment:', appointmentId);
    
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'Checked In' })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      console.error('Error checking in patient:', error);
      throw error;
    }

    console.log('Patient checked in successfully:', data);
    return data;
  }
};
