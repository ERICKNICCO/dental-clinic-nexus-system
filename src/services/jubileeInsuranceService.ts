import { supabase } from '../integrations/supabase/client';

// Using UAT environment for testing
const JUBILEE_API_BASE_URL = 'https://cmsuat.jubileetanzania.co.tz';
const JUBILEE_UAT_BASE_URL = 'https://cmsuat.jubileetanzania.co.tz';

// Test members for verification:
// Mr Amini Ally Kigalu - 11910808 - BGM FAMOUS FURNITURE LTD
// Mrd Linda Shukrani - 12182196 - Willows International Tanzania

export interface JubileeAuthResponse {
  Status: 'OK' | 'ERROR';
  Description: {
    access_token: string;
    provider_id: string;
    token_type: string;
    issued_at: number;
    not_before: number;
    expires_in: number;
  } | string;
}

export interface JubileeMemberDetails {
  Status: 'OK' | 'ERROR';
  Description: {
    MemberName: string;
    MemberNo: string;
    Company: string;
    Dob: string;
    ActiveStatus: string;
    DateTime: string;
    PrincipalMember: string;
    PrincipleMemberNo: string;
    Gender: string | null;
    Phone: string;
    ProviderID: string;
    LastAuthorization: string;
  } | string;
}

export interface JubileeVerificationResponse {
  Status: 'OK' | 'ERROR';
  MemberNo?: string;
  Description: string;
  User?: string;
  DateTime?: string;
  AuthorizationNo?: string;
  DailLimit?: number;
  Benefits?: Array<{
    BenefitCode: string;
    BenefitName: string;
    BenefitBalance: string;
  }>;
}

export interface JubileeClaimSubmission {
  entities: Array<{
    FolioID?: string | null;
    ClaimYear: string;
    ClaimMonth: string;
    FolioNo: string;
    SerialNo: string;
    CardNo: string;
    BillNo: string;
    FirstName: string;
    LastName: string;
    Gender: string;
    DateOfBirth: string;
    Age: string;
    TelephoneNo: string;
    PatientFileNo: string;
    PatientFile?: string;
    AuthorizationNo: string;
    AttendanceDate: string;
    PatientTypeCode: string;
    DateAdmitted?: string | null;
    DateDischarged?: string | null;
    PractitionerNo: string;
    CreatedBy: string;
    DateCreated: string;
    LastModifiedBy?: string | null;
    LastModified?: string | null;
    FolioDiseases: Array<{
      DiseaseCode: string;
      Remarks?: string | null;
      Status: string;
      CreatedBy: string;
      DateCreated: string;
      LastModifiedBy: string;
      LastModified: string;
    }>;
    FolioItems: Array<{
      ItemCode: string;
      OtherDetails?: string | null;
      ItemQuantity: number;
      UnitPrice: string;
      AmountClaimed: string;
      ApprovalRefNo?: string | null;
      CreatedBy: string;
      DateCreated: string;
      LastModifiedBy: string;
      LastModified: string;
    }>;
    ClaimFile?: string;
    ProviderID: string;
    ClinicalNotes: string;
    DelayReason?: string | null;
    LateAuthorizationReason?: string | null;
    AmountClaimed: string;
    EmergencyAuthorizationReason?: string | null;
    LateSubmissionReason?: string | null;
  }>;
}

export interface JubileeClaimResponse {
  Status: 'OK' | 'ERROR';
  Description: string;
  SubmissionID?: string;
}

class JubileeInsuranceService {
  // Production-ready methods using edge functions for better security and reliability

  async getMemberDetails(memberNo: string): Promise<JubileeMemberDetails> {
    console.log('🔍 Getting member details for:', memberNo);
    
    const { data, error } = await supabase.functions.invoke('jubilee-member-verify', {
      body: { memberNo }
    });

    if (error) {
      console.error('❌ Error getting member details:', error);
      throw new Error('Failed to get member details');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to get member details');
    }

    return data.data.memberDetails;
  }

  async checkMemberVerification(memberNo: string): Promise<JubileeVerificationResponse> {
    console.log('🔍 Checking member verification for:', memberNo);
    
    const { data, error } = await supabase.functions.invoke('jubilee-member-verify', {
      body: { memberNo }
    });

    if (error) {
      console.error('❌ Error checking member verification:', error);
      throw new Error('Failed to check member verification');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to check member verification');
    }

    return data.data.verification;
  }

  async verifyMemberComplete(memberNo: string) {
    console.log('🔍 Complete member verification for:', memberNo);
    
    const { data, error } = await supabase.functions.invoke('jubilee-member-verify', {
      body: { memberNo }
    });

    if (error) {
      console.error('❌ Error in complete member verification:', error);
      throw new Error('Failed to verify member');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to verify member');
    }

    return data.data;
  }

  async verifyItems(payload: {
    memberNo: string;
    benefitCode?: string;
    verifyItems: Array<{
      itemId: string;
      itemQuantity: string;
      itemPrice: string;
    }>;
    amount: string;
    procedureCode?: string;
  }) {
    console.log('🔍 Verifying items for member:', payload.memberNo);
    
    const { data, error } = await supabase.functions.invoke('jubilee-items-verify', {
      body: payload
    });

    if (error) {
      console.error('❌ Error verifying items:', error);
      throw new Error('Failed to verify items');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to verify items');
    }

    return data.data;
  }

  async getPriceList() {
    console.log('📋 Getting price list from Jubilee API');
    
    const { data, error } = await supabase.functions.invoke('jubilee-price-lists', {
      body: { type: 'price' }
    });

    if (error) {
      console.error('❌ Error getting price list:', error);
      throw new Error('Failed to get price list');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to get price list');
    }

    return data.data;
  }

  async getProcedureList() {
    console.log('📋 Getting procedure list from Jubilee API');
    
    const { data, error } = await supabase.functions.invoke('jubilee-price-lists', {
      body: { type: 'procedure' }
    });

    if (error) {
      console.error('❌ Error getting procedure list:', error);
      throw new Error('Failed to get procedure list');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to get procedure list');
    }

    return data.data;
  }

  async submitClaim(payload: {
    memberNo: string;
    authorizationNo: string;
    patientData: any;
    doctorData: any;
    treatments: any[];
    totalAmount: number;
    clinicalNotes?: string;
    diagnosisRemarks?: string;
  }): Promise<JubileeClaimResponse> {
    console.log('📄 Submitting claim for member:', payload.memberNo);
    
    const { data, error } = await supabase.functions.invoke('jubilee-preauth', {
      body: {
        ...payload,
        submissionType: 'claim'
      }
    });

    if (error) {
      console.error('❌ Error submitting claim:', error);
      throw new Error('Failed to submit claim');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to submit claim');
    }

    return data.data;
  }

  async requestPreauthorization(payload: {
    memberNo: string;
    authorizationNo: string;
    patientData: any;
    doctorData: any;
    treatments: any[];
    totalAmount: number;
    clinicalNotes?: string;
    diagnosisRemarks?: string;
  }) {
    console.log('📋 Requesting preauthorization for member:', payload.memberNo);
    
    const { data, error } = await supabase.functions.invoke('jubilee-preauth', {
      body: {
        ...payload,
        submissionType: 'preauth'
      }
    });

    if (error) {
      console.error('❌ Error requesting preauthorization:', error);
      throw new Error('Failed to request preauthorization');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to request preauthorization');
    }

    return data.data;
  }

  async getPreauthorizationStatus(submissionId: string) {
    console.log('🔍 Checking preauthorization status for:', submissionId);
    
    const { data, error } = await supabase.functions.invoke('jubilee-status-check', {
      body: { submissionId, type: 'preauth' }
    });

    if (error) {
      console.error('❌ Error checking preauth status:', error);
      throw new Error('Failed to check preauthorization status');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to check preauthorization status');
    }

    return data.data;
  }

  async getClaimStatus(submissionId: string) {
    console.log('🔍 Checking claim status for:', submissionId);
    
    const { data, error } = await supabase.functions.invoke('jubilee-status-check', {
      body: { submissionId, type: 'claim' }
    });

    if (error) {
      console.error('❌ Error checking claim status:', error);
      throw new Error('Failed to check claim status');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to check claim status');
    }

    return data.data;
  }
}

export const jubileeInsuranceService = new JubileeInsuranceService();