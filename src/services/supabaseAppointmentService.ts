
import { supabase } from '../integrations/supabase/client';
import { Appointment } from '../types/appointment';
import { supabaseNotificationService } from './supabaseNotificationService';

export const supabaseAppointmentService = {
  // Add appointment and trigger notification
  async addAppointment(appointment: Omit<Appointment, 'id'>): Promise<string> {
    console.log('Adding appointment:', appointment);
    
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        date: appointment.date,
        time: appointment.time,
        patient_name: appointment.patient_name,
        patient_phone: appointment.patient_phone || null,
        patient_email: appointment.patient_email || null,
        dentist: appointment.dentist,
        treatment: appointment.treatment,
        status: appointment.status || 'Pending',
        notes: appointment.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding appointment:', error);
      throw error;
    }

    console.log('Appointment added successfully:', data);
    
    // Create notification for the assigned doctor
    try {
      await supabaseNotificationService.createNotification({
        type: 'new_appointment',
        title: 'New Appointment Scheduled',
        message: `New appointment with ${appointment.patient_name} on ${appointment.date} at ${appointment.time}`,
        appointment_id: data.id,
        target_doctor_name: appointment.dentist,
      });
      console.log('Notification created for new appointment');
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't throw here to avoid failing the appointment creation
    }

    return data.id;
  },

  // Get all appointments
  async getAppointments(): Promise<Appointment[]> {
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
    
    return data.map(this.transformFromSupabase);
  },

  // Update appointment
  async updateAppointment(id: string, updates: Partial<Appointment>) {
    console.log('Updating appointment:', id, updates);
    
    const updateData: any = {};
    
    if (updates.date) updateData.date = updates.date;
    if (updates.time) updateData.time = updates.time;
    if (updates.patient_name) updateData.patient_name = updates.patient_name;
    if (updates.patient_phone !== undefined) updateData.patient_phone = updates.patient_phone;
    if (updates.patient_email !== undefined) updateData.patient_email = updates.patient_email;
    if (updates.dentist) updateData.dentist = updates.dentist;
    if (updates.treatment) updateData.treatment = updates.treatment;
    if (updates.status) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

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

    // Create notification for status changes
    if (updates.status && ['Approved', 'Cancelled'].includes(updates.status)) {
      try {
        await supabaseNotificationService.createNotification({
          type: updates.status === 'Approved' ? 'appointment_approved' : 'appointment_cancelled',
          title: `Appointment ${updates.status}`,
          message: `Your appointment has been ${updates.status.toLowerCase()}`,
          appointment_id: id,
          target_doctor_name: data.dentist,
        });
        console.log('Notification created for appointment status change');
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    }

    return data;
  },

  // Delete appointment
  async deleteAppointment(id: string) {
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

  // Transform Supabase data to app format
  transformFromSupabase(data: any): Appointment {
    return {
      id: data.id,
      date: data.date,
      time: data.time,
      patient_name: data.patient_name,
      patient_phone: data.patient_phone || '',
      patient_email: data.patient_email || '',
      dentist: data.dentist,
      treatment: data.treatment,
      status: data.status,
      notes: data.notes || '',
    };
  },

  // Subscribe to appointment changes with real-time updates
  subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
    console.log('Setting up appointments subscription');
    
    const channel = supabase
      .channel('appointments_changes')
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
      console.log('Unsubscribing from appointments changes');
      supabase.removeChannel(channel);
    };
  },

  // Check in patient
  async checkInPatient(appointmentId: string) {
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
  },

  // Row-level subscription for better performance
  subscribeToAppointmentsRowLevel(callback: (event: any) => void) {
    console.log('Setting up row-level appointments subscription');
    
    const channel = supabase
      .channel('appointments_row_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          console.log('Row-level appointment change:', payload);
          
          let transformedData = null;
          if (payload.new) {
            transformedData = this.transformFromSupabase(payload.new);
          }
          
          const event = {
            type: payload.eventType,
            newRow: transformedData,
            oldRow: payload.old ? this.transformFromSupabase(payload.old) : null
          };
          
          callback(event);
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from row-level appointments changes');
      supabase.removeChannel(channel);
    };
  }
};
