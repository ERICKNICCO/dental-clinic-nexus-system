import { supabase } from '../integrations/supabase/client';

export interface JubileeVerificationRequest {
  memberNumber: string;
  patientDetails: {
    name: string;
    dateOfBirth: string;
    idNumber: string;
  };
}

export interface JubileeVerificationResponse {
  isValid: boolean;
  memberDetails: {
    name: string;
    memberNumber: string;
    scheme: string;
    status: 'active' | 'inactive' | 'suspended';
    dependents?: Array<{
      name: string;
      relationship: string;
      dateOfBirth: string;
    }>;
  };
  benefits: {
    dentalCoverage: boolean;
    annualLimit: number;
    usedAmount: number;
    remainingAmount: number;
    copaymentPercentage: number;
    deductible: number;
  };
  error?: string;
}

export interface JubileeTreatmentRequest {
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

export interface JubileeTreatmentResponse {
  isApproved: boolean;
  approvedAmount: number;
  copaymentAmount: number;
  deductibleAmount: number;
  rejectedItems: Array<{
    code: string;
    reason: string;
  }>;
  authorizationNumber?: string;
  validUntil?: string;
}

export interface JubileeClaimSubmission {
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

export interface JubileeClaimResponse {
  claimNumber: string;
  status: 'submitted' | 'processing' | 'approved' | 'rejected';
  approvedAmount: number;
  paymentDate?: string;
  rejectionReason?: string;
}

export const jubileeInsuranceService = {
  // Verify Jubilee member eligibility using Supabase edge functions
  async verifyMember(request: JubileeVerificationRequest): Promise<JubileeVerificationResponse> {
    try {
      console.log('Verifying Jubilee member:', request.memberNumber);
      
      const { data, error } = await supabase.functions.invoke('jubilee-verify-member', {
        body: request
      });

      if (error) {
        console.error('Error from verification function:', error);
        return {
          isValid: false,
          memberDetails: {
            name: '',
            memberNumber: request.memberNumber,
            scheme: '',
            status: 'inactive'
          },
          benefits: {
            dentalCoverage: false,
            annualLimit: 0,
            usedAmount: 0,
            remainingAmount: 0,
            copaymentPercentage: 0,
            deductible: 0
          },
          error: error.message || 'Verification service unavailable'
        };
      }

      return data as JubileeVerificationResponse;
    } catch (error) {
      console.error('Error verifying Jubilee member:', error);
      return {
        isValid: false,
        memberDetails: {
          name: '',
          memberNumber: request.memberNumber,
          scheme: '',
          status: 'inactive'
        },
        benefits: {
          dentalCoverage: false,
          annualLimit: 0,
          usedAmount: 0,
          remainingAmount: 0,
          copaymentPercentage: 0,
          deductible: 0
        },
        error: 'Verification service unavailable'
      };
    }
  },

  // Get treatment authorization using Supabase edge functions
  async getTreatmentAuthorization(request: JubileeTreatmentRequest): Promise<JubileeTreatmentResponse> {
    try {
      console.log('Requesting Jubilee treatment authorization for:', request.memberNumber);
      
      const { data, error } = await supabase.functions.invoke('jubilee-authorize-treatment', {
        body: request
      });

      if (error) {
        console.error('Error from authorization function:', error);
        return {
          isApproved: false,
          approvedAmount: 0,
          copaymentAmount: 0,
          deductibleAmount: 0,
          rejectedItems: [],
          authorizationNumber: undefined
        };
      }

      return data as JubileeTreatmentResponse;
    } catch (error) {
      console.error('Error getting Jubilee treatment authorization:', error);
      return {
        isApproved: false,
        approvedAmount: 0,
        copaymentAmount: 0,
        deductibleAmount: 0,
        rejectedItems: [],
        authorizationNumber: undefined
      };
    }
  },

  // Submit claim to Jubilee using Supabase edge functions
  async submitClaim(claim: JubileeClaimSubmission): Promise<JubileeClaimResponse> {
    try {
      console.log('Submitting Jubilee claim for member:', claim.memberNumber);
      
      const { data, error } = await supabase.functions.invoke('jubilee-submit-claim', {
        body: claim
      });

      if (error) {
        console.error('Error from claim submission function:', error);
        throw error;
      }

      return data as JubileeClaimResponse;
    } catch (error) {
      console.error('Error submitting Jubilee claim:', error);
      throw error;
    }
  },

  // Check claim status using Supabase edge functions
  async checkClaimStatus(claimNumber: string): Promise<JubileeClaimResponse> {
    try {
      console.log('Checking Jubilee claim status:', claimNumber);
      
      const { data, error } = await supabase.functions.invoke('jubilee-check-claim-status', {
        body: { claimNumber }
      });

      if (error) {
        console.error('Error from claim status function:', error);
        throw error;
      }

      return data as JubileeClaimResponse;
    } catch (error) {
      console.error('Error checking Jubilee claim status:', error);
      throw error;
    }
  },

  // Calculate copayment for Jubilee treatments
  calculateCopayment(
    totalAmount: number, 
    copaymentPercentage: number = 10, 
    deductible: number = 5000
  ): {
    insuranceCovered: number;
    patientCopayment: number;
    deductibleAmount: number;
    copaymentPercentage: number;
  } {
    // Apply deductible first
    const amountAfterDeductible = Math.max(0, totalAmount - deductible);
    const actualDeductible = Math.min(totalAmount, deductible);
    
    // Calculate copayment on amount after deductible
    const copaymentAmount = Math.floor(amountAfterDeductible * (copaymentPercentage / 100));
    const insuranceCovered = amountAfterDeductible - copaymentAmount;
    const patientCopayment = actualDeductible + copaymentAmount;

    return {
      insuranceCovered,
      patientCopayment,
      deductibleAmount: actualDeductible,
      copaymentPercentage
    };
  }
};