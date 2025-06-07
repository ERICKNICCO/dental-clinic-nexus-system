
import { supabase } from '../integrations/supabase/client';
import { Appointment } from '../types/appointment';

export interface SupabaseAppointment {
  id: string;
  date: string;
  time: string;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  treatment: string;
  dentist: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Approved' | 'Checked In' | 'In Progress' | 'Completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const supabaseAppointmentService = {
  // Transform Supabase data to match our Appointment interface
  transformToAppointment(data: SupabaseAppointment): Appointment {
    return {
      id: data.id,
      date: data.date,
      time: data.time,
      patient: {
        name: data.patient_name,
        phone: data.patient_phone || 'No phone',
        email: data.patient_email || '',
        image: this.getProfilePictureFromEmail(data.patient_email || ''),
        initials: this.getInitials(data.patient_name)
      },
      treatment: data.treatment,
      dentist: data.dentist,
      status: data.status,
      patientId: data.id
    };
  },

  // Generate profile picture URL from email
  getProfilePictureFromEmail(email: string): string {
    if (!email) return '';
    const hash = email.toLowerCase().trim();
    return `https://www.gravatar.com/avatar/${btoa(hash)}?d=404&s=80`;
  },

  // Get initials from name
  getInitials(name: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  // Add appointment
  async addAppointment(appointmentData: Omit<Appointment, 'id'>) {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        date: appointmentData.date,
        time: appointmentData.time,
        patient_name: appointmentData.patient.name,
        patient_phone: appointmentData.patient.phone,
        patient_email: appointmentData.patient.email,
        treatment: appointmentData.treatment,
        dentist: appointmentData.dentist,
        status: appointmentData.status,
        notes: (appointmentData as any).notes || null
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  },

  // Get all appointments
  async getAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return data.map(item => this.transformToAppointment(item));
  },

  // Update appointment
  async updateAppointment(id: string, updates: Partial<Appointment>) {
    const updateData: any = {};
    
    if (updates.date) updateData.date = updates.date;
    if (updates.time) updateData.time = updates.time;
    if (updates.treatment) updateData.treatment = updates.treatment;
    if (updates.dentist) updateData.dentist = updates.dentist;
    if (updates.status) updateData.status = updates.status;
    if (updates.patient) {
      if (updates.patient.name) updateData.patient_name = updates.patient.name;
      if (updates.patient.phone) updateData.patient_phone = updates.patient.phone;
      if (updates.patient.email) updateData.patient_email = updates.patient.email;
    }
    if ((updates as any).notes) updateData.notes = (updates as any).notes;

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    // Send email notification if status is being updated to confirmed or approved
    if (updates.status && ['Confirmed', 'Approved'].includes(updates.status)) {
      await this.sendEmailNotification(id, updates.status === 'Approved' ? 'approval' : 'confirmation');
    }
  },

  // Delete appointment
  async deleteAppointment(id: string) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Send email notification
  async sendEmailNotification(appointmentId: string, emailType: 'confirmation' | 'approval' | 'reminder' | 'cancellation') {
    try {
      // Get appointment details
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (error || !appointment) {
        console.error('Error fetching appointment for email:', error);
        return;
      }

      if (!appointment.patient_email) {
        console.log('No email address for patient, skipping email notification');
        return;
      }

      // Call edge function to send email
      const { error: emailError } = await supabase.functions.invoke('send-appointment-email', {
        body: {
          appointmentId: appointment.id,
          recipientEmail: appointment.patient_email,
          patientName: appointment.patient_name,
          appointmentDate: appointment.date,
          appointmentTime: appointment.time,
          treatment: appointment.treatment,
          dentist: appointment.dentist,
          emailType: emailType
        }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
      } else {
        console.log('Email notification sent successfully');
      }
    } catch (error) {
      console.error('Error in sendEmailNotification:', error);
    }
  },

  // Subscribe to real-time updates
  subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
    const channel = supabase
      .channel('appointments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'appointments' },
        async () => {
          // Fetch updated appointments
          const appointments = await this.getAppointments();
          callback(appointments);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
