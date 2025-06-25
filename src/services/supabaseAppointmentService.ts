import { supabase } from '../integrations/supabase/client';
import { Appointment } from '../types/appointment';
import { emailNotificationService } from './emailNotificationService';
import { supabaseNotificationService } from './supabaseNotificationService';
import { supabasePatientService } from './supabasePatientService';

// Use the actual Supabase database row type instead of custom interface
type SupabaseAppointmentRow = {
  id: string;
  date: string;
  time: string;
  patient_name: string;
  patient_phone: string | null;
  patient_email: string | null;
  patient_id?: string;
  treatment: string;
  dentist: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Transform function outside the service object to avoid circular references
const transformToAppointment = (data: SupabaseAppointmentRow): Appointment => {
  return {
    id: data.id,
    date: data.date,
    time: data.time,
    patient: {
      name: data.patient_name,
      phone: data.patient_phone || '',
      email: data.patient_email || '',
      image: '',
    },
    treatment: data.treatment,
    dentist: data.dentist,
    status: data.status as 'Confirmed' | 'Pending' | 'Cancelled' | 'Approved' | 'Checked In' | 'In Progress' | 'Completed',
    patientId: data.patient_id,
    notes: data.notes,
  };
};

// Helper function to generate patient ID
const generatePatientId = async (): Promise<string> => {
  try {
    console.log('Generating patient ID...');
    const allPatients = await supabasePatientService.getPatients();
    
    let highestNumber = 0;
    
    allPatients.forEach((patient) => {
      if (patient.patientId) {
        const match = patient.patientId.match(/SD-25-(\d+)/);
        if (match) {
          const number = parseInt(match[1]);
          if (number > highestNumber) {
            highestNumber = number;
          }
        }
      }
    });
    
    const nextNumber = highestNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(5, '0');
    const newPatientId = `SD-25-${paddedNumber}`;
    console.log('Generated new patient ID:', newPatientId);
    return newPatientId;
  } catch (error) {
    console.error('Error generating patient ID:', error);
    return 'SD-25-00001';
  }
};

// Helper function to find existing patient
const findExistingPatient = async (appointmentData: SupabaseAppointmentRow) => {
  try {
    const allPatients = await supabasePatientService.getPatients();
    
    // Check for exact name match first
    const nameMatch = allPatients.find(p => 
      p.name.toLowerCase() === appointmentData.patient_name.toLowerCase()
    );
    if (nameMatch) return nameMatch;
    
    // Check for phone match
    if (appointmentData.patient_phone) {
      const phoneMatch = allPatients.find(p => p.phone === appointmentData.patient_phone);
      if (phoneMatch) return phoneMatch;
    }
    
    // Check for email match
    if (appointmentData.patient_email) {
      const emailMatch = allPatients.find(p => 
        p.email.toLowerCase() === appointmentData.patient_email.toLowerCase()
      );
      if (emailMatch) return emailMatch;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding existing patient:', error);
    return null;
  }
};

// Helper function to add patient from appointment
const addPatientFromAppointment = async (appointmentData: SupabaseAppointmentRow) => {
  try {
    console.log('🔥 Adding patient from approved appointment:', appointmentData.patient_name);
    
    // Check if patient already exists
    const existingPatient = await findExistingPatient(appointmentData);
    
    if (existingPatient) {
      console.log('✅ Patient already exists:', existingPatient.name);
      
      // Update appointment with patient_id if not already set
      if (!appointmentData.patient_id) {
        await supabase
          .from('appointments')
          .update({ patient_id: existingPatient.patientId })
          .eq('id', appointmentData.id);
        console.log('✅ Updated appointment with existing patient_id:', existingPatient.patientId);
      }
      
      return existingPatient;
    }

    // Create new patient with information from appointment
    const patientId = await generatePatientId();
    
    const newPatient = {
      patientId: patientId,
      name: appointmentData.patient_name,
      email: appointmentData.patient_email || '',
      phone: appointmentData.patient_phone || '',
      dateOfBirth: '', // To be filled later during consultation
      gender: '', // To be filled later during consultation
      address: '', // To be filled later during consultation
      emergencyContact: '',
      emergencyPhone: '',
      insurance: '',
      patientType: 'cash' as const,
      lastVisit: new Date().toISOString().split('T')[0],
      nextAppointment: '',
    };

    console.log('🔥 Creating new patient from appointment:', newPatient);
    
    const newPatientDbId = await supabasePatientService.addPatient(newPatient);
    console.log('✅ Patient created from appointment with DB ID:', newPatientDbId);
    
    // Update appointment with the new patient_id
    await supabase
      .from('appointments')
      .update({ patient_id: patientId })
      .eq('id', appointmentData.id);
    console.log('✅ Updated appointment with new patient_id:', patientId);
    
    return { ...newPatient, id: newPatientDbId };
  } catch (error) {
    console.error('❌ Error adding patient from appointment:', error);
    throw error;
  }
};

export const supabaseAppointmentService = {
  // Transform Supabase appointment to app appointment
  transformToAppointment,

  // Add appointment
  async addAppointment(appointmentData: Omit<Appointment, 'id'>) {
    console.log('🔥 SupabaseAppointmentService: Adding appointment with data:', appointmentData);
    
    // Try to find patient_id by patient name if not provided
    let patientId = appointmentData.patientId;
    if (!patientId && appointmentData.patient?.name) {
      console.log('🔥 SupabaseAppointmentService: Looking up patient_id for:', appointmentData.patient.name);
      try {
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('patient_id')
          .eq('name', appointmentData.patient.name)
          .single();
        
        if (!patientError && patientData) {
          patientId = patientData.patient_id;
          console.log('✅ SupabaseAppointmentService: Found patient_id:', patientId);
        } else {
          console.warn('⚠️ SupabaseAppointmentService: Could not find patient_id for:', appointmentData.patient.name);
        }
      } catch (error) {
        console.warn('⚠️ SupabaseAppointmentService: Error looking up patient_id:', error);
      }
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        date: appointmentData.date,
        time: appointmentData.time,
        patient_name: appointmentData.patient.name,
        patient_phone: appointmentData.patient.phone,
        patient_email: appointmentData.patient.email,
        patient_id: patientId,
        treatment: appointmentData.treatment,
        dentist: appointmentData.dentist,
        status: appointmentData.status,
        notes: appointmentData.notes
      })
      .select()
      .single();

    if (error) {
      console.error('❌ SupabaseAppointmentService: Error adding appointment:', error);
      throw error;
    }
    
    console.log('✅ SupabaseAppointmentService: Appointment added successfully:', data);

    // Create notification for new appointment - notify all admins
    try {
      await supabaseNotificationService.createNotification({
        type: 'appointment',
        title: 'New Appointment Received',
        message: `New appointment request from ${appointmentData.patient.name} for ${appointmentData.date} at ${appointmentData.time} with ${appointmentData.dentist}`,
        target_doctor_name: null, // null means notify all admins
        appointment_id: data.id
      });
      console.log('✅ SupabaseAppointmentService: Created notification for new appointment');
    } catch (error) {
      console.error('❌ SupabaseAppointmentService: Error creating notification:', error);
    }

    return data.id;
  },

  // Get all appointments
  async getAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return data.map(transformToAppointment);
  },

  // Get appointments by patient ID
  async getAppointmentsByPatientId(patientId: string): Promise<Appointment[]> {
    console.log('🔥 SupabaseAppointmentService: Getting appointments for patient_id:', patientId);
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });

    if (error) {
      console.error('❌ SupabaseAppointmentService: Error getting appointments by patient_id:', error);
      throw error;
    }
    
    console.log('✅ SupabaseAppointmentService: Found appointments:', data);
    return data.map(transformToAppointment);
  },

  // Get appointments by patient name (fallback method)
  async getAppointmentsByPatientName(patientName: string): Promise<Appointment[]> {
    console.log('🔥 SupabaseAppointmentService: Getting appointments for patient_name:', patientName);
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_name', patientName)
      .order('date', { ascending: false });

    if (error) {
      console.error('❌ SupabaseAppointmentService: Error getting appointments by patient_name:', error);
      throw error;
    }
    
    console.log('✅ SupabaseAppointmentService: Found appointments by name:', data);
    return data.map(transformToAppointment);
  },

  // Update appointment
  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    console.log('🔥 SupabaseAppointmentService: Updating appointment:', { id, updates });

    // Build update object with explicit properties to avoid type inference issues
    const updateFields: {
      date?: string;
      time?: string;
      patient_name?: string;
      patient_phone?: string;
      patient_email?: string;
      treatment?: string;
      dentist?: string;
      status?: string;
      notes?: string;
    } = {};
    
    if (updates.date !== undefined) updateFields.date = updates.date;
    if (updates.time !== undefined) updateFields.time = updates.time;
    if (updates.patient?.name !== undefined) updateFields.patient_name = updates.patient.name;
    if (updates.patient?.phone !== undefined) updateFields.patient_phone = updates.patient.phone;
    if (updates.patient?.email !== undefined) updateFields.patient_email = updates.patient.email;
    if (updates.treatment !== undefined) updateFields.treatment = updates.treatment;
    if (updates.dentist !== undefined) updateFields.dentist = updates.dentist;
    if (updates.status !== undefined) updateFields.status = updates.status;
    if (updates.notes !== undefined) updateFields.notes = updates.notes;

    const { data, error } = await supabase
      .from('appointments')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ SupabaseAppointmentService: Error updating appointment:', error);
      throw error;
    }

    console.log('✅ SupabaseAppointmentService: Appointment updated successfully:', data);

    // Check if status changed to "Approved" and add patient if needed
    if (updates.status === 'Approved') {
      try {
        console.log('🔥 SupabaseAppointmentService: Status changed to Approved, adding patient to system');
        await addPatientFromAppointment(data);
      } catch (error) {
        console.error('❌ SupabaseAppointmentService: Error adding patient from approved appointment:', error);
        // Don't throw error here, appointment update was successful
      }
    }

    // Send confirmation email if status changed to "Confirmed"
    if (updates.status === 'Confirmed' && data.patient_email) {
      try {
        await emailNotificationService.sendAppointmentConfirmation({
          to: data.patient_email,
          subject: 'Appointment Confirmed - Dental Clinic',
          appointmentDate: data.date,
          appointmentTime: data.time,
          patientName: data.patient_name,
          dentistName: data.dentist,
          treatment: data.treatment,
          appointmentId: data.id
        });
        
        console.log('✅ SupabaseAppointmentService: Confirmation email sent to patient');
      } catch (emailError) {
        console.error('❌ SupabaseAppointmentService: Error sending confirmation email:', emailError);
        // Don't throw error, appointment update was successful
      }
    }

    // Create notification for status updates
    if (updates.status) {
      try {
        await supabaseNotificationService.createNotification({
          type: 'appointment',
          title: 'Appointment Status Updated',
          message: `Appointment with ${data.patient_name} has been ${updates.status.toLowerCase()}`,
          target_doctor_name: data.dentist,
          appointment_id: id
        });
        console.log('✅ SupabaseAppointmentService: Created notification for appointment update');
      } catch (error) {
        console.error('❌ SupabaseAppointmentService: Error creating notification:', error);
      }
    }

    return transformToAppointment(data);
  },

  // Delete appointment
  async deleteAppointment(id: string) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ SupabaseAppointmentService: Error deleting appointment:', error);
      throw error;
    }

    console.log('✅ SupabaseAppointmentService: Appointment deleted successfully:', id);
  },

  // Subscribe to appointments - return the channel directly
  subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
    console.log('🔥 SupabaseAppointmentService: Setting up appointments subscription');
    return supabase
      .channel('appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        async () => {
          // Fetch updated appointments list
          const { data } = await supabase
            .from('appointments')
            .select('*')
            .order('date', { ascending: true });

          if (data) {
            callback(data.map(transformToAppointment));
          }
        }
      )
      .subscribe();
  }
};
