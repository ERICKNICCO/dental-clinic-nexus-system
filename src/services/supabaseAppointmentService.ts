
import { supabase } from '../integrations/supabase/client';
import { Appointment } from '../types/appointment';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabasePatientService } from './supabasePatientService';
import { supabaseNotificationService } from './supabaseNotificationService';

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
        phone: data.patient_phone || '',
        image: '' // Add default empty image
      },
      patient_name: data.patient_name,
      patient_email: data.patient_email || '',
      patient_phone: data.patient_phone || '',
      treatment: data.treatment,
      dentist: data.dentist,
      status: data.status as 'Confirmed' | 'Pending' | 'Cancelled' | 'Approved' | 'Checked In' | 'In Progress' | 'Completed',
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

  async getAppointmentsByPatientId(patientId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data.map(item => this.transformToAppointment(item));
  },

  async updateAppointment(id: string, updates: Partial<Appointment>) {
    console.log('🔥 SupabaseAppointmentService: Updating appointment:', id, updates);
    
    // IMPORTANT: Create patient BEFORE updating appointment status
    if (updates.status === 'Approved') {
      console.log('🔥 Status is being changed to Approved, creating patient first...');
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
        return null;
      }

      console.log('🔥 Appointment data:', appointment);

      // Get existing patients to check for duplicates and generate ID
      const existingPatients = await supabasePatientService.getPatients();
      console.log('🔥 Existing patients count:', existingPatients.length);

      // Enhanced duplicate check - check by name, email, and phone
      const existingPatient = existingPatients.find(p => {
        const nameMatch = p.name.toLowerCase().trim() === (appointment.patient_name || '').toLowerCase().trim();
        const emailMatch = appointment.patient_email && p.email && 
          p.email.toLowerCase().trim() === appointment.patient_email.toLowerCase().trim();
        const phoneMatch = appointment.patient_phone && p.phone && 
          p.phone.replace(/\s+/g, '') === appointment.patient_phone.replace(/\s+/g, '');
        
        console.log('🔍 Checking patient:', p.name);
        console.log('🔍 Name match:', nameMatch);
        console.log('🔍 Email match:', emailMatch);
        console.log('🔍 Phone match:', phoneMatch);
        
        return nameMatch || emailMatch || phoneMatch;
      });

      if (existingPatient) {
        console.log('✅ Patient already exists:', existingPatient.id, existingPatient.name);
        
        // Update appointment with patient_id if not already set
        if (!appointment.patient_id) {
          console.log('🔄 Updating appointment with existing patient ID:', existingPatient.id);
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

      // Create new patient with proper data from appointment
      const newPatientData = {
        patientId: generatePatientId(),
        name: appointment.patient_name || 'Unknown Patient',
        email: appointment.patient_email || '',
        phone: appointment.patient_phone || '',
        dateOfBirth: '1990-01-01', // Default date - should be updated by staff
        gender: 'Other', // Default - should be updated by staff
        address: 'Not provided', // Default - should be updated by staff
        emergencyContact: 'Not provided', // Default - should be updated by staff
        emergencyPhone: 'Not provided', // Default - should be updated by staff
        insurance: '', // Default - should be updated based on patient type
        lastVisit: '',
        nextAppointment: appointment.date,
        patientType: 'cash' as const // Default - should be updated by staff
      };

      console.log('🔥 Creating new patient with data:', newPatientData);
      const newPatientId = await supabasePatientService.addPatient(newPatientData);
      console.log('✅ Patient created with ID:', newPatientId);
      
      // Update appointment with patient_id
      console.log('🔄 Updating appointment with new patient ID:', newPatientId);
      await supabase
        .from('appointments')
        .update({ patient_id: newPatientId })
        .eq('id', appointmentId);

      console.log('✅ Patient created and appointment updated successfully');
      return newPatientId;
    } catch (error) {
      console.error('❌ Error creating patient from appointment:', error);
      throw error; // Re-throw to handle in calling function
    }
  },

  // Enhanced method to process ALL existing approved appointments
  async processAllApprovedAppointments() {
    try {
      console.log('🔥 Processing ALL approved appointments to create missing patients...');
      
      // Get all approved appointments
      const { data: approvedAppointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'Approved');

      if (error) {
        console.error('❌ Error fetching approved appointments:', error);
        return;
      }

      console.log('🔥 Found approved appointments:', approvedAppointments?.length || 0);

      if (approvedAppointments && approvedAppointments.length > 0) {
        let processedCount = 0;
        let newPatientsCount = 0;
        
        for (const appointment of approvedAppointments) {
          console.log('🔄 Processing appointment:', appointment.id, appointment.patient_name);
          
          try {
            const patientId = await this.createPatientFromAppointment(appointment.id);
            processedCount++;
            
            // Check if a new patient was created (not just linked to existing)
            if (patientId && !appointment.patient_id) {
              newPatientsCount++;
            }
          } catch (error) {
            console.error('❌ Error processing appointment:', appointment.id, error);
          }
        }
        
        console.log(`✅ Processed ${processedCount} appointments, created ${newPatientsCount} new patients`);
      }

      console.log('✅ Finished processing all approved appointments');
    } catch (error) {
      console.error('❌ Error processing approved appointments:', error);
    }
  },

  // New method to automatically process existing approved appointments without patient_id
  async processExistingApprovedAppointments() {
    try {
      console.log('🔥 Processing existing approved appointments without patient_id...');
      
      // Get all approved appointments without patient_id
      const { data: approvedAppointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'Approved')
        .is('patient_id', null);

      if (error) {
        console.error('❌ Error fetching approved appointments:', error);
        return;
      }

      console.log('🔥 Found approved appointments without patient_id:', approvedAppointments?.length || 0);

      if (approvedAppointments && approvedAppointments.length > 0) {
        for (const appointment of approvedAppointments) {
          console.log('🔄 Processing appointment:', appointment.id, appointment.patient_name);
          await this.createPatientFromAppointment(appointment.id);
        }
      }

      console.log('✅ Finished processing existing approved appointments');
    } catch (error) {
      console.error('❌ Error processing existing approved appointments:', error);
    }
  },

  async deleteAppointment(id: string): Promise<void> {
    console.log('🔥 supabaseAppointmentService: Deleting appointment:', id);
    
    try {
      // First delete any associated payment records to avoid foreign key constraint
      console.log('🔥 Deleting associated payment records for appointment:', id);
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('appointment_id', id);

      if (paymentsError) {
        console.warn('⚠️ Could not delete payment records:', paymentsError);
      }

      // Now delete the appointment
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ supabaseAppointmentService: Error deleting appointment:', error);
        throw error;
      }

      console.log('✅ supabaseAppointmentService: Appointment deleted successfully');
    } catch (error) {
      console.error('❌ supabaseAppointmentService: Error in deleteAppointment:', error);
      throw error;
    }
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
        async (payload) => {
          console.log('🔥 Appointments changed, processing and fetching updated data');
          
          // If an appointment was updated to 'Approved', process it
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'Approved') {
            console.log('🔥 Appointment approved, creating patient if needed');
            try {
              await this.createPatientFromAppointment(payload.new.id);
            } catch (error) {
              console.error('❌ Error processing approved appointment:', error);
            }
          }
          
          const appointments = await this.getAppointments();
          callback(appointments);
        }
      )
      .subscribe();

    // Initial fetch and process any existing approved appointments
    this.getAppointments().then(async (appointments) => {
      // Process existing approved appointments
      await this.processExistingApprovedAppointments();
      
      // Then send the appointments to callback
      const updatedAppointments = await this.getAppointments();
      callback(updatedAppointments);
    });

    return channel;
  }
};
