import { supabase } from '../integrations/supabase/client';

export interface GAVerificationRequest {
  memberNumber: string;
  patientDetails: {
    name: string;
    dateOfBirth: string;
    idNumber: string;
  };
}

export interface GAVerificationResponse {
  isValid: boolean;
  memberDetails: {
    name: string;
    memberNumber: string;
    scheme: string;
    status: 'active' | 'inactive' | 'suspended';
  };
  benefits: {
    dentalCoverage: boolean;
    annualLimit: number;
    usedAmount: number;
    remainingAmount: number;
    copaymentPercentage: number;
  };
  error?: string;
}

export interface GATreatmentRequest {
  memberNumber: string;
  treatments: Array<{
    code: string;
    name: string;
    amount: number;
    quantity: number;
  }>;
  providerDetails: {
    name: string;
    registrationNumber: string;
  };
}

export interface GATreatmentResponse {
  isApproved: boolean;
  approvedAmount: number;
  copaymentAmount: number;
  rejectedItems: Array<{
    code: string;
    reason: string;
  }>;
  authorizationNumber?: string;
  validUntil?: string;
}

export interface GAClaimSubmission {
  memberNumber: string;
  authorizationNumber: string;
  treatments: Array<{
    code: string;
    name: string;
    amount: number;
    date: string;
  }>;
  receipts: string[]; // Base64 encoded receipts
  invoiceNumber: string;
}

export interface GAClaimResponse {
  claimNumber: string;
  status: 'submitted' | 'processing' | 'approved' | 'rejected';
  approvedAmount: number;
  paymentDate?: string;
  rejectionReason?: string;
}

export const gaInsuranceService = {
  // Verify GA member eligibility
  async verifyMember(request: GAVerificationRequest): Promise<GAVerificationResponse> {
    try {
      console.log('Verifying GA member:', request.memberNumber);

      // Call Supabase Edge Function that integrates with SMART (GA)
      const { data, error } = await supabase.functions.invoke('smart-ga', {
        body: {
          action: 'verify_member',
          patientNumber: request.memberNumber,
          // Optionally pass sessionId if already captured from card tap flow
          sessionId: undefined,
        },
      });

      if (error) throw error;
      if (!data?.ok) {
        return {
          isValid: false,
          memberDetails: {
            name: '',
            memberNumber: request.memberNumber,
            scheme: '',
            status: 'inactive',
          },
          benefits: {
            dentalCoverage: false,
            annualLimit: 0,
            usedAmount: 0,
            remainingAmount: 0,
            copaymentPercentage: 0,
          },
          error: data?.error || 'Verification failed',
        };
      }

      // Attempt to map SMART response
      const member = data.member || {};
      const benefits = data.benefits || {};

      const coPay = Number(benefits?.co_pay_amount ?? benefits?.copay ?? 20) || 20;
      const annualLimit = Number(benefits?.amount ?? benefits?.annual_limit ?? 500000) || 500000;
      const usedAmount = Number(benefits?.used ?? 0) || 0;
      const remainingAmount = Math.max(annualLimit - usedAmount, 0);

      return {
        isValid: true,
        memberDetails: {
          name: member?.patient_name || request.patientDetails.name,
          memberNumber: request.memberNumber,
          scheme: member?.medical_aid_plan || 'GA Smart',
          status: 'active',
        },
        benefits: {
          dentalCoverage: true,
          annualLimit,
          usedAmount,
          remainingAmount,
          copaymentPercentage: coPay,
        },
      };
    } catch (error) {
      console.error('Error verifying GA member:', error);
      return {
        isValid: false,
        memberDetails: {
          name: '',
          memberNumber: request.memberNumber,
          scheme: '',
          status: 'inactive',
        },
        benefits: {
          dentalCoverage: false,
          annualLimit: 0,
          usedAmount: 0,
          remainingAmount: 0,
          copaymentPercentage: 0,
        },
        error: 'Verification service unavailable',
      };
    }
  },

  // Get treatment authorization
  async getTreatmentAuthorization(request: GATreatmentRequest): Promise<GATreatmentResponse> {
    try {
      console.log('Requesting GA treatment authorization for:', request.memberNumber);
      
      // Calculate total amount
      const totalAmount = request.treatments.reduce((sum, treatment) => 
        sum + (treatment.amount * treatment.quantity), 0
      );

      // Simulate authorization logic
      const copaymentPercentage = 20; // 20% copayment for GA
      const approvedAmount = Math.floor(totalAmount * 0.8); // Approve 80%
      const copaymentAmount = totalAmount - approvedAmount;

      return {
        isApproved: true,
        approvedAmount,
        copaymentAmount,
        rejectedItems: [], // No rejected items in simulation
        authorizationNumber: `GA-AUTH-${Date.now()}`,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };
    } catch (error) {
      console.error('Error getting GA treatment authorization:', error);
      return {
        isApproved: false,
        approvedAmount: 0,
        copaymentAmount: 0,
        rejectedItems: [],
        authorizationNumber: undefined
      };
    }
  },

  // Submit claim to GA
  async submitClaim(patientId: string, patientName: string, authorizationNumber: string, treatmentItems: any[], invoiceNumber: string): Promise<GAClaimResponse> {
    try {
      console.log('Submitting GA claim for patient:', patientName);
      
      // Store claim in our database
      const { data, error } = await supabase
        .from('insurance_claims')
        .insert({
          patient_id: patientId,
          patient_name: patientName,
          insurance_provider: 'GA Insurance',
          claim_status: 'submitted',
          patient_signature: 'Digital signature captured',
          treatment_details: {
            authorizationNumber: authorizationNumber,
            treatments: treatmentItems,
            invoiceNumber: invoiceNumber
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate claim submission
      const claimNumber = `GA-CLAIM-${Date.now()}`;
      const totalAmount = treatmentItems.reduce((sum: number, treatment: any) => sum + treatment.cost, 0);
      const approvedAmount = Math.floor(totalAmount * 0.8); // 80% approval simulation

      return {
        claimNumber,
        status: 'submitted',
        approvedAmount,
        paymentDate: undefined // Will be set when claim is processed
      };
    } catch (error) {
      console.error('Error submitting GA claim:', error);
      throw error;
    }
  },

  // Check claim status via SMART
  async checkClaimStatus(claimId: string): Promise<GAClaimResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('smart-ga', {
        body: { action: 'claim_status', claimId },
      });
      if (error) throw error;
      const statusData = data?.data || data;
      return {
        claimNumber: String(claimId),
        status: (statusData?.status || 'processing') as GAClaimResponse['status'],
        approvedAmount: Number(statusData?.approved_amount ?? 0),
        paymentDate: statusData?.payment_date,
        rejectionReason: statusData?.rejection_reason,
      };
    } catch (error) {
      console.error('Error checking GA claim status:', error);
      throw error;
    }
  },

  // SMART visit/session helpers
  async getSession(patientNumber: string) {
    const { data, error } = await supabase.functions.invoke('smart-ga', {
      body: { action: 'get_session', patientNumber }
    });
    if (error) throw error;
    return data?.data || data;
  },

  async linkSession(visitNumber: string, sessionId: string) {
    const { data, error } = await supabase.functions.invoke('smart-ga', {
      body: { action: 'link_session', visitNumber, sessionId }
    });
    if (error) throw error;
    return data?.data || data;
  },

  // ICD-10 diagnosis posting
  async postDiagnosis(diagnosis: any) {
    const { data, error } = await supabase.functions.invoke('smart-ga', {
      body: { action: 'post_diagnosis', diagnosis }
    });
    if (error) throw error;
    return data?.data || data;
  },

  // Final claim submission using SMART
  async submitFinalClaim(claim: any) {
    const { data, error } = await supabase.functions.invoke('smart-ga', {
      body: { action: 'submit_final_claim', claim }
    });
    if (error) throw error;
    return data?.data || data;
  },

  async submitInterimClaim(claim: any) {
    const { data, error } = await supabase.functions.invoke('smart-ga', {
      body: { action: 'submit_interim_claim', claim }
    });
    if (error) throw error;
    return data?.data || data;
  },

  async submitAdmission(admission: any) {
    const { data, error } = await supabase.functions.invoke('smart-ga', {
      body: { action: 'submit_admission', admission }
    });
    if (error) throw error;
    return data?.data || data;
  },

  async submitDischarge(discharge: any) {
    const { data, error } = await supabase.functions.invoke('smart-ga', {
      body: { action: 'submit_discharge', discharge }
    });
    if (error) throw error;
    return data?.data || data;
  },

  // Calculate copayment for GA treatments
  calculateCopayment(totalAmount: number, copaymentPercentage: number = 20): {
    insuranceCovered: number;
    patientCopayment: number;
    copaymentPercentage: number;
  } {
    const patientCopayment = Math.floor(totalAmount * (copaymentPercentage / 100));
    const insuranceCovered = totalAmount - patientCopayment;

    return {
      insuranceCovered,
      patientCopayment,
      copaymentPercentage
    };
  }
};