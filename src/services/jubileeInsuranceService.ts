import { supabase } from '../integrations/supabase/client';

const JUBILEE_API_BASE_URL = 'https://cms.jubileetanzania.co.tz';
const JUBILEE_UAT_BASE_URL = 'https://cmsuat.jubileetanzania.co.tz';

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
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private providerId: string | null = null;

  private async getCredentials() {
    // Get credentials from Supabase Edge Function secrets
    const { data, error } = await supabase.functions.invoke('jubilee-credentials');
    if (error) throw new Error('Failed to get Jubilee credentials');
    return data;
  }

  private async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = await this.getCredentials();
      
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);
      formData.append('providerid', credentials.providerId);

      const response = await fetch(`${JUBILEE_API_BASE_URL}/jubileeapi/Token`, {
        method: 'POST',
        body: formData,
      });

      const data: JubileeAuthResponse = await response.json();
      
      if (data.Status === 'OK' && typeof data.Description === 'object') {
        this.accessToken = data.Description.access_token;
        this.tokenExpiry = data.Description.expires_in * 1000; // Convert to milliseconds
        this.providerId = data.Description.provider_id;
        return this.accessToken;
      } else {
        throw new Error(typeof data.Description === 'string' ? data.Description : 'Authentication failed');
      }
    } catch (error) {
      console.error('Jubilee authentication error:', error);
      throw error;
    }
  }

  async getMemberDetails(memberNo: string): Promise<JubileeMemberDetails> {
    const token = await this.authenticate();
    
    const response = await fetch(
      `${JUBILEE_API_BASE_URL}/jubileeapi/Getcarddetails?MemberNo=${memberNo}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return await response.json();
  }

  async checkMemberVerification(memberNo: string): Promise<JubileeVerificationResponse> {
    const token = await this.authenticate();
    
    const response = await fetch(
      `${JUBILEE_API_BASE_URL}/jubileeapi/CheckVerification?MemberNo=${memberNo}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return await response.json();
  }

  async verifyItems(payload: {
    BenefitCode: string;
    MemberNo: string;
    VerifyItems: Array<{
      ItemId: string;
      ItemQuantity: string;
      ItemPrice: string;
    }>;
    Amount: string;
    Procedured: string;
  }) {
    const token = await this.authenticate();
    
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    const response = await fetch(`${JUBILEE_API_BASE_URL}/jubileeapi/VerifyItems`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return await response.json();
  }

  async getPriceList() {
    const token = await this.authenticate();
    
    const response = await fetch(`${JUBILEE_API_BASE_URL}/jubileeapi/GetPriceList`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  }

  async getProcedureList() {
    const token = await this.authenticate();
    
    const response = await fetch(`${JUBILEE_API_BASE_URL}/jubileeapi/GetProcedureList`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  }

  async submitClaim(claimData: JubileeClaimSubmission): Promise<JubileeClaimResponse> {
    const token = await this.authenticate();
    
    const response = await fetch(`${JUBILEE_API_BASE_URL}/jubileeapi/SendClaim`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(claimData),
    });

    return await response.json();
  }

  async requestPreauthorization(preAuthData: any) {
    const token = await this.authenticate();
    
    const response = await fetch(`${JUBILEE_API_BASE_URL}/jubileeapi/SendPreauthorization`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preAuthData),
    });

    return await response.json();
  }

  async getPreauthorizationStatus(submissionId: string) {
    const token = await this.authenticate();
    
    const response = await fetch(
      `${JUBILEE_API_BASE_URL}/jubileeapi/getPreauthorizationStatus?submissionID=${submissionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return await response.json();
  }
}

export const jubileeInsuranceService = new JubileeInsuranceService();