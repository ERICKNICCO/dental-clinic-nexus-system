
import { supabase } from '../integrations/supabase/client';

export interface InsuranceClaim {
  id: string;
  patient_id: string;
  patient_name: string;
  consultation_id: string;
  appointment_id?: string;
  insurance_provider: string;
  claim_number?: string;
  treatment_details: {
    diagnosis: string;
    treatment_plan: string;
    procedures: string[];
    total_amount: number;
  };
  patient_signature: string; // Base64 encoded signature
  claim_status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  submitted_at?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export const insuranceClaimService = {
  // Create a new insurance claim
  async createClaim(claimData: Omit<InsuranceClaim, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('insurance_claims')
        .insert({
          patient_id: claimData.patient_id,
          patient_name: claimData.patient_name,
          consultation_id: claimData.consultation_id,
          appointment_id: claimData.appointment_id,
          insurance_provider: claimData.insurance_provider,
          treatment_details: claimData.treatment_details,
          patient_signature: claimData.patient_signature,
          claim_status: claimData.claim_status || 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating insurance claim:', error);
      throw error;
    }
  },

  // Submit claim to insurance provider (placeholder for API integration)
  async submitClaim(claimId: string): Promise<void> {
    try {
      // TODO: Integrate with NHIF API when available
      // For now, just update status to submitted
      const { error } = await supabase
        .from('insurance_claims')
        .update({
          claim_status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (error) throw error;
    } catch (error) {
      console.error('Error submitting claim:', error);
      throw error;
    }
  },

  // Get claims by patient
  async getClaimsByPatient(patientId: string): Promise<InsuranceClaim[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_claims')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InsuranceClaim[];
    } catch (error) {
      console.error('Error fetching claims:', error);
      return [];
    }
  },

  // Format claim data for NHIF submission
  formatNHIFClaim(claim: InsuranceClaim) {
    return {
      // Based on the NHIF form template
      facilityCode: 'YOUR_FACILITY_CODE', // TODO: Add to system settings
      patientName: claim.patient_name,
      patientId: claim.patient_id,
      diagnosis: claim.treatment_details.diagnosis,
      procedures: claim.treatment_details.procedures,
      totalAmount: claim.treatment_details.total_amount,
      signature: claim.patient_signature
    };
  }
};
