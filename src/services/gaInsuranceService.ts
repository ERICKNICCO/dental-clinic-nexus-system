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
      
      // Simulate GA API call - in production, this would be an actual API call
      // For now, we'll simulate based on member number pattern
      const isValidMember = /^GA\d{8}$/.test(request.memberNumber);
      
      if (!isValidMember) {
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
            copaymentPercentage: 0
          },
          error: 'Invalid member number format'
        };
      }

      // Simulate successful verification
      return {
        isValid: true,
        memberDetails: {
          name: request.patientDetails.name,
          memberNumber: request.memberNumber,
          scheme: 'GA Comprehensive',
          status: 'active'
        },
        benefits: {
          dentalCoverage: true,
          annualLimit: 500000, // TSH 500,000
          usedAmount: Math.floor(Math.random() * 200000), // Random used amount
          remainingAmount: 300000,
          copaymentPercentage: 20 // 20% copayment
        }
      };
    } catch (error) {
      console.error('Error verifying GA member:', error);
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
          copaymentPercentage: 0
        },
        error: 'Verification service unavailable'
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
  async submitClaim(claim: GAClaimSubmission): Promise<GAClaimResponse> {
    try {
      console.log('Submitting GA claim for member:', claim.memberNumber);
      
      // Store claim in our database
      const { data, error } = await supabase
        .from('insurance_claims')
        .insert({
          patient_id: claim.memberNumber,
          patient_name: 'GA Member', // Would be filled from member verification
          insurance_provider: 'GA',
          claim_status: 'submitted',
          treatment_details: {
            authorizationNumber: claim.authorizationNumber,
            treatments: claim.treatments,
            invoiceNumber: claim.invoiceNumber
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate claim submission
      const claimNumber = `GA-CLAIM-${Date.now()}`;
      const totalAmount = claim.treatments.reduce((sum, treatment) => sum + treatment.amount, 0);
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

  // Check claim status
  async checkClaimStatus(claimNumber: string): Promise<GAClaimResponse> {
    try {
      console.log('Checking GA claim status:', claimNumber);
      
      // Simulate claim status check
      const statuses: Array<'submitted' | 'processing' | 'approved' | 'rejected'> = 
        ['submitted', 'processing', 'approved'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      return {
        claimNumber,
        status: randomStatus,
        approvedAmount: randomStatus === 'approved' ? 80000 : 0,
        paymentDate: randomStatus === 'approved' ? new Date().toISOString() : undefined
      };
    } catch (error) {
      console.error('Error checking GA claim status:', error);
      throw error;
    }
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