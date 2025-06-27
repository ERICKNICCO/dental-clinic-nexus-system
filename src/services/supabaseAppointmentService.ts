
import { supabase } from '../integrations/supabase/client';
import { Appointment } from '../types/appointment';
import { supabaseNotificationService } from './supabaseNotificationService';

export interface SupabaseAppointment {
  id: string;
  date: string;
  time: string;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_id?: string;
  treatment: string;
  dentist: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const supabaseAppointmentService = {
  transformToAppointment(data: SupabaseAppointment): Appointment {
    return {
      id: data.id,
      date: data.date,
      time: data.time,
      patient: {
        name: data.patient_name,
        phone: data.patient_phone || '',
        email: data.patient_email || '',
        image: '',
        initials: data.patient_name ? data.patient_name.split(' ').map(n => n[0]).join('') : 'U'
      },
      patient_name: data.patient_name,
      patient_phone: data.patient_phone,
      patient_email: data.patient_email,
      patient_id: data.patient_id,
      treatment: data.treatment,
      dentist: data.dentist,
      status: data.status as Appointment['status'],
      notes: data.notes
    };
  },

  async addAppointment(appointmentData: Omit<Appointment, 'id'>) {
    console.log('🔥 Adding appointment to Supabase:', appointmentData);
    
    const supabaseData = {
      date: appointmentData.date,
      time: appointmentData.time,
      patient_name: appointmentData.patient?.name || appointmentData.patient_name,
      patient_phone: appointmentData.patient?.phone || appointmentData.patient_phone,
      patient_email: appointmentData.patient?.email || appointmentData.patient_email,
      patient_id: appointmentData.patient_id,
      treatment: appointmentData.treatment,
      dentist: appointmentData.dentist,
      status: appointmentData.status || 'Pending',
      notes: appointmentData.notes
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert([supabaseData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding appointment:', error);
      throw error;
    }

    console.log('✅ Appointment added:', data);
    
    // Create notification for the assigned doctor
    try {
      await supabaseNotificationService.createAppointmentNotification({
        ...data,
        patient: { name: data.patient_name },
        patient_name: data.patient_name
      });
      console.log('✅ Notification created for appointment');
    } catch (notificationError) {
      console.warn('⚠️ Failed to create notification:', notificationError);
      // Don't fail the appointment creation if notification fails
    }

    return this.transformToAppointment(data);
  },

  async getAppointments(): Promise<Appointment[]> {
    console.log('🔥 Fetching appointments from Supabase');
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('❌ Error fetching appointments:', error);
      throw error;
    }

    console.log('✅ Fetched appointments:', data.length);
    return data.map(this.transformToAppointment);
  },

  async updateAppointment(id: string, updates: Partial<Appointment>) {
    console.log('🔥 Updating appointment:', id, updates);

    const supabaseUpdates: any = {};
    
    if (updates.date) supabaseUpdates.date = updates.date;
    if (updates.time) supabaseUpdates.time = updates.time;
    if (updates.patient?.name || updates.patient_name) {
      supabaseUpdates.patient_name = updates.patient?.name || updates.patient_name;
    }
    if (updates.patient?.phone || updates.patient_phone) {
      supabaseUpdates.patient_phone = updates.patient?.phone || updates.patient_phone;
    }
    if (updates.patient?.email || updates.patient_email) {
      supabaseUpdates.patient_email = updates.patient?.email || updates.patient_email;
    }
    if (updates.patient_id) supabaseUpdates.patient_id = updates.patient_id;
    if (updates.treatment) supabaseUpdates.treatment = updates.treatment;
    if (updates.dentist) supabaseUpdates.dentist = updates.dentist;
    if (updates.status) supabaseUpdates.status = updates.status;
    if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;

    const { data, error } = await supabase
      .from('appointments')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating appointment:', error);
      throw error;
    }

    console.log('✅ Appointment updated:', data);
    return this.transformToAppointment(data);
  },

  async deleteAppointment(id: string): Promise<void> {
    console.log('🔥 Deleting appointment:', id);
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting appointment:', error);
      throw error;
    }

    console.log('✅ Appointment deleted');
  },

  subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
    console.log('🔥 Setting up appointments subscription');
    
    const fetchAndNotify = async () => {
      try {
        const appointments = await this.getAppointments();
        callback(appointments);
      } catch (error) {
        console.error('❌ Error in subscription callback:', error);
      }
    };

    const channel = supabase
      .channel('appointments_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          console.log('🔥 Appointments table changed, refetching...');
          fetchAndNotify();
        }
      )
      .subscribe();

    // Initial fetch
    fetchAndNotify();

    return channel;
  }
};
