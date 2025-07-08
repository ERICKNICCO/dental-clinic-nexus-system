import { supabase } from '../integrations/supabase/client';
import { Patient } from '../types/patient';

export interface SupabasePatient {
  id: string;
  patient_id: string;
  name: string;
  email?: string;
  phone?: string;
  date_of_birth: string;
  gender: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  insurance?: string;
  last_visit?: string;
  next_appointment?: string;
  patient_type: 'cash' | 'insurance';
  created_at: string;
  updated_at: string;
}

export const supabasePatientService = {
  transformToPatient(data: SupabasePatient): Patient {
    return {
      id: data.id,
      patientId: data.patient_id,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      dateOfBirth: data.date_of_birth,
      gender: data.gender,
      address: data.address,
      emergencyContact: data.emergency_contact,
      emergencyPhone: data.emergency_phone,
      insurance: data.insurance || '',
      lastVisit: data.last_visit || '',
      nextAppointment: data.next_appointment || '',
      patientType: data.patient_type,
    };
  },

  async addPatient(patientData: Omit<Patient, 'id'>) {
    // Check for existing patient by name, phone, or email
    const existing = await this.getPatientByUniqueFields(patientData.name, patientData.phone, patientData.email);
    if (existing) {
      // Return the existing patient id
      return existing.id;
    }
    const { data, error } = await supabase
      .from('patients')
      .insert({
        patient_id: patientData.patientId,
        name: patientData.name,
        email: patientData.email,
        phone: patientData.phone,
        date_of_birth: patientData.dateOfBirth,
        gender: patientData.gender,
        address: patientData.address,
        emergency_contact: patientData.emergencyContact,
        emergency_phone: patientData.emergencyPhone,
        insurance: patientData.insurance,
        last_visit: patientData.lastVisit,
        next_appointment: patientData.nextAppointment,
        patient_type: patientData.patientType,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  },

  async getPatients(): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data.map(item => this.transformToPatient(item));
  },

  async getPatient(id: string): Promise<Patient | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.transformToPatient(data);
  },

  async updatePatient(id: string, updates: Partial<Patient>) {
    const { data, error } = await supabase
      .from('patients')
      .update({
        patient_id: updates.patientId,
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        date_of_birth: updates.dateOfBirth,
        gender: updates.gender,
        address: updates.address,
        emergency_contact: updates.emergencyContact,
        emergency_phone: updates.emergencyPhone,
        insurance: updates.insurance,
        last_visit: updates.lastVisit,
        next_appointment: updates.nextAppointment,
        patient_type: updates.patientType,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.transformToPatient(data);
  },

  async deletePatient(id: string): Promise<void> {
    console.log('🔥 SupabasePatientService: Deleting patient:', id);
    
    // First, delete related records to maintain referential integrity
    try {
      // Delete medical history
      await supabase
        .from('medical_history')
        .delete()
        .eq('patient_id', id);
      
      // Delete treatment notes
      await supabase
        .from('treatment_notes')
        .delete()
        .eq('patient_id', id);
      
      // Delete consultations
      await supabase
        .from('consultations')
        .delete()
        .eq('patient_id', id);
      
      console.log('✅ SupabasePatientService: Related records deleted');
    } catch (error) {
      console.warn('⚠️ SupabasePatientService: Error deleting related records:', error);
    }
    
    // Delete the patient
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ SupabasePatientService: Error deleting patient:', error);
      throw error;
    }

    console.log('✅ SupabasePatientService: Patient deleted successfully');
  },

  async searchPatients(searchTerm: string): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data.map(item => this.transformToPatient(item));
  },

  async getPatientByUniqueFields(name: string, phone: string, email: string): Promise<Patient | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`name.eq.${name},phone.eq.${phone},email.eq.${email}`)
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return this.transformToPatient(data);
  }
};
