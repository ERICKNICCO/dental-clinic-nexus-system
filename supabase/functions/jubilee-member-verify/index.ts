import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface JubileeMemberDetails {
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

interface JubileeVerificationResponse {
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

async function getValidToken(): Promise<string> {
  // Try to get existing valid token from database
  const { data: tokenData } = await supabase
    .from('jubilee_auth_tokens')
    .select('*')
    .single()

  if (tokenData && new Date(tokenData.expires_at) > new Date()) {
    console.log('🔑 Using cached token')
    return tokenData.access_token
  }

  // Get fresh token if none exists or expired
  console.log('🔄 Getting fresh authentication token...')
  const authResponse = await supabase.functions.invoke('jubilee-auth')
  
  if (authResponse.error) {
    throw new Error('Failed to authenticate with Jubilee API')
  }

  return authResponse.data.data.access_token
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const { memberNo } = await req.json()
    
    if (!memberNo) {
      throw new Error('Member number is required')
    }

    console.log('🔍 Verifying member:', memberNo)

    // Get valid access token
    const accessToken = await getValidToken()

    // Get member details
    console.log('📡 Fetching member details...')
    const memberResponse = await fetch(
      `https://cmsuat.jubileetanzania.co.tz/jubileeapi/Getcarddetails?MemberNo=${memberNo}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!memberResponse.ok) {
      throw new Error(`Failed to fetch member details: ${memberResponse.status}`)
    }

    const memberDetails: JubileeMemberDetails = await memberResponse.json()

    if (memberDetails.Status === 'ERROR') {
      throw new Error(typeof memberDetails.Description === 'string' ? memberDetails.Description : 'Failed to get member details')
    }

    // Check verification status
    console.log('🔍 Checking verification status...')
    const verificationResponse = await fetch(
      `https://cmsuat.jubileetanzania.co.tz/jubileeapi/CheckVerification?MemberNo=${memberNo}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!verificationResponse.ok) {
      throw new Error(`Failed to check verification: ${verificationResponse.status}`)
    }

    const verificationData: JubileeVerificationResponse = await verificationResponse.json()

    // Log verification attempt in database
    const { error: logError } = await supabase
      .from('jubilee_verifications')
      .insert({
        member_no: memberNo,
        verification_status: verificationData.Status,
        authorization_no: verificationData.AuthorizationNo || null,
        daily_limit: verificationData.DailLimit || null,
        benefits: verificationData.Benefits || [],
        verification_response: verificationData,
        member_details: memberDetails.Description,
        verified_at: new Date().toISOString()
      })

    if (logError) {
      console.warn('⚠️ Failed to log verification:', logError.message)
    }

    console.log('✅ Member verification completed:', verificationData.Status)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          memberDetails,
          verification: verificationData
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Member verification error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Member verification failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})