
import { supabase } from '../integrations/supabase/client';
import { Appointment } from '../types/appointment';
import { supabasePatientService } from './supabasePatientService';

export interface SupabaseAppointment {
  id: string;
  patient_name: string;
  patient_email?: string;
  patient_phone?: string;
  treatment: string;
  dentist: string;
  status: string;
  date: string;
  time: string;
  notes?: string;
  patient_id?: string;
  created_at: string;
  updated_at: string;
}

export const supabaseAppointmentService = {
  transformToAppointment(data: SupabaseAppointment): Appointment {
    return {
      id: data.id,
      patient: {
        name: data.patient_name,
        email: data.patient_email || '',
        phone: data.patient_phone || ''
      },
      patient_name: data.patient_name,
      patient_email: data.patient_email || '',
      patient_phone: data.patient_phone || '',
      treatment: data.treatment,
      dentist: data.dentist,
      status: data.status,
      date: data.date,
      time: data.time,
      notes: data.notes || '',
      patient_id: data.patient_id
    };
  },

  async addAppointment(appointmentData: Omit<Appointment, 'id'>) {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_name: appointmentData.patient?.name || appointmentData.patient_name,
        patient_email: appointmentData.patient?.email || appointmentData.patient_email,
        patient_phone: appointmentData.patient?.phone || appointmentData.patient_phone,
        treatment: appointmentData.treatment,
        dentist: appointmentData.dentist,
        status: appointmentData.status,
        date: appointmentData.date,
        time: appointmentData.time,
        notes: appointmentData.notes,
        patient_id: appointmentData.patient_id
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  },

  async getAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data.map(item => this.transformToAppointment(item));
  },

  async updateAppointment(id: string, updates: Partial<Appointment>) {
    console.log('🔥 SupabaseAppointmentService: Updating appointment:', id, updates);
    
    // If status is being changed to 'Approved', create patient record if it doesn't exist
    if (updates.status === 'Approved') {
      await this.createPatientFromAppointment(id);
    }

    const updateData: any = {};
    
    if (updates.patient?.name || updates.patient_name) {
      updateData.patient_name = updates.patient?.name || updates.patient_name;
    }
    if (updates.patient?.email || updates.patient_email) {
      updateData.patient_email = updates.patient?.email || updates.patient_email;
    }
    if (updates.patient?.phone || updates.patient_phone) {
      updateData.patient_phone = updates.patient?.phone || updates.patient_phone;
    }
    if (updates.treatment) updateData.treatment = updates.treatment;
    if (updates.dentist) updateData.dentist = updates.dentist;
    if (updates.status) updateData.status = updates.status;
    if (updates.date) updateData.date = updates.date;
    if (updates.time) updateData.time = updates.time;
    if (updates.notes) updateData.notes = updates.notes;
    if (updates.patient_id) updateData.patient_id = updates.patient_id;

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.transformToAppointment(data);
  },

  async createPatientFromAppointment(appointmentId: string) {
    try {
      console.log('🔥 Creating patient from appointment:', appointmentId);
      
      // Get the appointment details
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (appointmentError || !appointment) {
        console.error('❌ Error fetching appointment:', appointmentError);
        return;
      }

      // Check if patient already exists by name, email, or phone
      const existingPatients = await supabasePatientService.getPatients();
      const existingPatient = existingPatients.find(p => 
        p.name.toLowerCase() === appointment.patient_name?.toLowerCase() ||
        (appointment.patient_email && p.email === appointment.patient_email) ||
        (appointment.patient_phone && p.phone === appointment.patient_phone)
      );

      if (existingPatient) {
        console.log('✅ Patient already exists:', existingPatient.id);
        // Update appointment with patient_id if not already set
        if (!appointment.patient_id) {
          await supabase
            .from('appointments')
            .update({ patient_id: existingPatient.id })
            .eq('id', appointmentId);
        }
        return existingPatient.id;
      }

      // Generate patient ID
      const generatePatientId = () => {
        const existingIds = existingPatients.map(p => p.patientId).filter(Boolean);
        let maxNumber = 0;
        
        existingIds.forEach(id => {
          const match = id.match(/SD-25-(\d+)/);
          if (match) {
            const number = parseInt(match[1]);
            if (number > maxNumber) {
              maxNumber = number;
            }
          }
        });
        
        const nextNumber = maxNumber + 1;
        return `SD-25-${nextNumber.toString().padStart(5, '0')}`;
      };

      // Create new patient
      const newPatientData = {
        patientId: generatePatientId(),
        name: appointment.patient_name || 'Unknown Patient',
        email: appointment.patient_email || '',
        phone: appointment.patient_phone || '',
        dateOfBirth: '1990-01-01', // Default date - should be updated later
        gender: 'Other', // Default - should be updated later
        address: 'Not provided', // Default - should be updated later
        emergencyContact: 'Not provided', // Default - should be updated later
        emergencyPhone: 'Not provided', // Default - should be updated later
        insurance: '', // Default - should be updated later
        lastVisit: new Date().toISOString().split('T')[0],
        nextAppointment: appointment.date,
        patientType: 'cash' as const // Default - should be updated later
      };

      console.log('🔥 Creating new patient:', newPatientData);
      const newPatientId = await supabasePatientService.addPatient(newPatientData);
      
      // Update appointment with patient_id
      await supabase
        .from('appointments')
        .update({ patient_id: newPatientId })
        .eq('id', appointmentId);

      console.log('✅ Patient created and appointment updated:', newPatientId);
      return newPatientId;
    } catch (error) {
      console.error('❌ Error creating patient from appointment:', error);
    }
  },

  async deleteAppointment(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
    console.log('🔥 Setting up appointments subscription');
    
    const channel = supabase
      .channel('appointments-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        async () => {
          console.log('🔥 Appointments changed, fetching updated data');
          const appointments = await this.getAppointments();
          callback(appointments);
        }
      )
      .subscribe();

    // Initial fetch
    this.getAppointments().then(callback);

    return channel;
  }
};
