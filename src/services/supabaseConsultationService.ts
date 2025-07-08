import { supabase } from '../integrations/supabase/client';
import { Consultation } from '../types/consultation';

export interface SupabaseConsultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  appointment_id?: string;
  status: 'in-progress' | 'waiting-xray' | 'xray-done' | 'completed' | 'cancelled';
  symptoms: string;
  examination: string;
  vital_signs: {
    bloodPressure?: string;
    temperature?: string;
    heartRate?: string;
    weight?: string;
    height?: string;
  };
  diagnosis: string;
  diagnosis_type: 'clinical' | 'xray';
  treatment_plan: string;
  prescriptions: string;
  follow_up_instructions: string;
  next_appointment?: string;
  estimated_cost?: number;
  treatment_items?: Array<{
    name: string;
    cost: number;
    duration: string;
  }>;
  xray_result?: {
    images: string[];
    note: string;
    radiologist: string;
  } | null;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const supabaseConsultationService = {
  // Transform Supabase data to match our Consultation interface
  transformToConsultation(data: SupabaseConsultation): Consultation {
    return {
      id: data.id,
      patientId: data.patient_id,
      doctorId: data.doctor_id,
      doctorName: data.doctor_name,
      appointmentId: data.appointment_id,
      status: data.status,
      symptoms: data.symptoms || '',
      examination: data.examination || '',
      vitalSigns: data.vital_signs || {},
      diagnosis: data.diagnosis || '',
      diagnosisType: data.diagnosis_type || 'clinical',
      treatmentPlan: data.treatment_plan || '',
      prescriptions: data.prescriptions || '',
      followUpInstructions: data.follow_up_instructions || '',
      nextAppointment: data.next_appointment,
      estimatedCost: data.estimated_cost,
      treatmentItems: data.treatment_items || [],
      xrayResult: data.xray_result,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  // Start a new consultation
  async startConsultation(patientId: string, doctorId: string, doctorName: string, appointmentId?: string): Promise<Consultation> {
    console.log('Starting new consultation in Supabase:', { patientId, doctorId, doctorName, appointmentId });
    
    const consultationData = {
      patient_id: patientId,
      doctor_id: doctorId,
      doctor_name: doctorName,
      appointment_id: appointmentId,
      status: 'in-progress' as const,
      symptoms: '',
      examination: '',
      vital_signs: {},
      diagnosis: '',
      diagnosis_type: 'clinical' as const,
      treatment_plan: '',
      prescriptions: '',
      follow_up_instructions: '',
      started_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('consultations')
      .insert(consultationData)
      .select()
      .single();

    if (error) {
      console.error('Error starting consultation:', error);
      throw error;
    }

    console.log('Consultation started with ID:', data.id);
    return this.transformToConsultation(data);
  },

  // Get active consultation for a patient
  async getActiveConsultation(patientId: string): Promise<Consultation | null> {
    console.log('Fetching active consultation for patient:', patientId);
    
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .in('status', ['in-progress', 'waiting-xray', 'xray-done'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching active consultation:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No active consultation found');
      return null;
    }

    const consultation = this.transformToConsultation(data[0]);
    console.log('Active consultation found:', consultation);
    return consultation;
  },

  // Update consultation data
  async updateConsultation(id: string, updates: Partial<Consultation>): Promise<void> {
    console.log('Updating consultation:', id, updates);
    
    const updateData: Partial<SupabaseConsultation> = {};
    
    if (updates.symptoms !== undefined) updateData.symptoms = updates.symptoms;
    if (updates.examination !== undefined) updateData.examination = updates.examination;
    if (updates.vitalSigns !== undefined) updateData.vital_signs = updates.vitalSigns;
    if (updates.diagnosis !== undefined) updateData.diagnosis = updates.diagnosis;
    if (updates.diagnosisType !== undefined) updateData.diagnosis_type = updates.diagnosisType;
    if (updates.treatmentPlan !== undefined) updateData.treatment_plan = updates.treatmentPlan;
    if (updates.prescriptions !== undefined) updateData.prescriptions = updates.prescriptions;
    if (updates.followUpInstructions !== undefined) updateData.follow_up_instructions = updates.followUpInstructions;
    if (updates.nextAppointment !== undefined) updateData.next_appointment = updates.nextAppointment;
    if (updates.estimatedCost !== undefined) updateData.estimated_cost = updates.estimatedCost;
    if (updates.treatmentItems !== undefined) updateData.treatment_items = updates.treatmentItems;
    if (updates.xrayResult !== undefined) updateData.xray_result = updates.xrayResult;
    if (updates.status !== undefined) updateData.status = updates.status;

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('consultations')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating consultation:', error);
      throw error;
    }

    console.log('Consultation updated successfully');
  },

  // Complete consultation
  async completeConsultation(id: string, finalData: Partial<Consultation>): Promise<void> {
    console.log('Completing consultation:', id);
    
    const updateData: Partial<SupabaseConsultation> = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add any final data updates
    if (finalData.symptoms !== undefined) updateData.symptoms = finalData.symptoms;
    if (finalData.examination !== undefined) updateData.examination = finalData.examination;
    if (finalData.vitalSigns !== undefined) updateData.vital_signs = finalData.vitalSigns;
    if (finalData.diagnosis !== undefined) updateData.diagnosis = finalData.diagnosis;
    if (finalData.diagnosisType !== undefined) updateData.diagnosis_type = finalData.diagnosisType;
    if (finalData.treatmentPlan !== undefined) updateData.treatment_plan = finalData.treatmentPlan;
    if (finalData.prescriptions !== undefined) updateData.prescriptions = finalData.prescriptions;
    if (finalData.followUpInstructions !== undefined) updateData.follow_up_instructions = finalData.followUpInstructions;
    if (finalData.nextAppointment !== undefined) updateData.next_appointment = finalData.nextAppointment;
    if (finalData.estimatedCost !== undefined) updateData.estimated_cost = finalData.estimatedCost;
    if (finalData.treatmentItems !== undefined) updateData.treatment_items = finalData.treatmentItems;

    const { error } = await supabase
      .from('consultations')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error completing consultation:', error);
      throw error;
    }

    console.log('Consultation completed successfully');
  },

  // Get all consultations for a specific patient
  async getPatientConsultations(patientId: string): Promise<Consultation[]> {
    console.log('Fetching all consultations for patient:', patientId);
    
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching patient consultations:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No consultations found for patient');
      return [];
    }

    return data.map(this.transformToConsultation);
  },

  // Get all consultations with status 'waiting-xray'
  async getWaitingXRayConsultations(): Promise<Consultation[]> {
    console.log('Fetching consultations waiting for X-ray from Supabase.');
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('status', 'waiting-xray')
      .order('updated_at', { ascending: false }); // Order by most recently updated

    if (error) {
      console.error('Error fetching waiting X-ray consultations:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No consultations found waiting for X-ray.');
      return [];
    }

    // Transform Supabase data to the Consultation interface
    return data.map(this.transformToConsultation);
  },

  // Get a consultation by ID
  async getConsultation(id: string): Promise<Consultation | null> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error fetching consultation:', error);
      return null;
    }
    return this.transformToConsultation(data);
  },

  // Get all consultations
  async getAllConsultations(): Promise<Consultation[]> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*');
    if (error) {
      console.error('Error fetching all consultations:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map(this.transformToConsultation);
  },

  // Get latest consultation by appointment ID
  async getLatestConsultationByAppointmentId(appointmentId: string): Promise<Consultation | null> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) {
      console.error('Error fetching consultation by appointment ID:', error);
      return null;
    }
    if (!data || data.length === 0) return null;
    return this.transformToConsultation(data[0]);
  },
};
