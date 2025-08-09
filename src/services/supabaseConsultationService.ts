import { supabase } from '../integrations/supabase/client';

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  appointment_id?: string;
  status: 'in-progress' | 'waiting-xray' | 'xray-done' | 'completed' | 'cancelled';

  // Consultation steps
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
  diagnosis_type?: 'clinical' | 'xray';
  treatment_plan: string;
  prescriptions: string;
  follow_up_instructions: string;
  next_appointment?: string;

  // Treatment cost information
  estimated_cost?: number;
  treatment_items?: Array<{
    name: string;
    cost: number;
    duration: string;
  }>;

  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;

  xray_result?: {
    images: string[];
    note: string;
    radiologist: string;
  } | null;
}

export const supabaseConsultationService = {
  // Start a new consultation
  async startConsultation(patientId: string, doctorId: string, doctorName: string, appointmentId?: string) {
    try {
      console.log('Starting new consultation:', { patientId, doctorId, doctorName, appointmentId });
      
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
        follow_up_instructions: ''
      };
      
      const { data, error } = await supabase
        .from('consultations')
        .insert(consultationData)
        .select()
        .single();

      if (error) throw error;
      
      console.log('Consultation started with ID:', data.id);
      return data as unknown as Consultation;
    } catch (error) {
      console.error('Error starting consultation:', error);
      throw error;
    }
  },

  // Get active consultation for a patient
  async getActiveConsultation(patientId: string): Promise<Consultation | null> {
    try {
      console.log('Fetching active consultation for patient:', patientId);
      
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .in('status', ['in-progress', 'waiting-xray', 'xray-done'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        console.log('No active consultation found');
        return null;
      }
      
      console.log('Active consultation found:', data);
      return data as unknown as Consultation;
    } catch (error) {
      console.error('Error fetching active consultation:', error);
      throw error;
    }
  },

  // Update consultation data
  async updateConsultation(id: string, updates: Partial<Consultation>) {
    try {
      console.log('Updating consultation:', id, updates);
      
      const { error } = await supabase
        .from('consultations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      console.log('Consultation updated successfully');
    } catch (error) {
      console.error('Error updating consultation:', error);
      throw error;
    }
  },

  // Complete consultation
  async completeConsultation(id: string, finalData: Partial<Consultation>) {
    try {
      console.log('Completing consultation (rpc first, then fallback):', id);

      // 1) Try server-side procedure for reliability
      const { error: rpcError } = await supabase.rpc('update_consultation_status', {
        consultation_id: id,
        new_status: 'completed',
        completed_at: new Date().toISOString(),
      });

      if (rpcError) {
        console.warn('RPC update_consultation_status failed, falling back to direct update:', rpcError.message);
        // 2) Fallback to direct table update
        const { error: updateError } = await supabase
          .from('consultations')
          .update({
            ...finalData,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateError) throw updateError;
      }

      console.log('Consultation completed successfully');
    } catch (error) {
      console.error('Error completing consultation:', error);
      throw error;
    }
  },

  // Get consultations for a patient
  async getPatientConsultations(patientId: string) {
    try {
      console.log('Fetching consultations for patient:', patientId);
      
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched consultations:', data);
      return data as unknown as Consultation[];
    } catch (error) {
      console.error('Error fetching consultations:', error);
      throw error;
    }
  },

  // Get consultation by ID (legacy method)
  async getConsultation(id: string) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as Consultation;
    } catch (error) {
      console.error('Error fetching consultation:', error);
      throw error;
    }
  },

  // Get all consultations (for admin)
  async getAllConsultations() {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Consultation[];
    } catch (error) {
      console.error('Error fetching all consultations:', error);
      throw error;
    }
  },

  // Get waiting X-ray consultations
  async getWaitingXRayConsultations() {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('status', 'waiting-xray')
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Consultation[];
    } catch (error) {
      console.error('Error fetching waiting X-ray consultations:', error);
      throw error;
    }
  },

  // Get latest consultation by appointment ID
  async getLatestConsultationByAppointmentId(appointmentId: string) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Consultation | null;
    } catch (error) {
      console.error('Error fetching latest consultation by appointment ID:', error);
      throw error;
    }
  }
};