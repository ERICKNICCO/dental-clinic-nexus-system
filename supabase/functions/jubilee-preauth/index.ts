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

    const payload = await req.json()
    const { 
      memberNo, 
      authorizationNo, 
      patientData, 
      doctorData, 
      treatments, 
      totalAmount,
      submissionType = 'preauth' // 'preauth' or 'claim'
    } = payload
    
    if (!memberNo || !authorizationNo || !treatments || !totalAmount) {
      throw new Error('Member number, authorization number, treatments, and total amount are required')
    }

    console.log(`🔍 Processing ${submissionType} for member:`, memberNo)
    console.log('💰 Total amount:', totalAmount)

    // Get valid access token
    const accessToken = await getValidToken()

    // Generate unique submission identifiers
    const currentDate = new Date()
    const billNo = `BILL${Date.now()}`
    const folioNo = `FLO${Date.now()}`
    
    // Prepare preauthorization/claim payload
    const jubileePayload = {
      entities: [{
        FolioID: null,
        ClaimYear: currentDate.getFullYear().toString(),
        ClaimMonth: (currentDate.getMonth() + 1).toString().padStart(2, '0'),
        FolioNo: folioNo,
        SerialNo: '1',
        CardNo: memberNo,
        BillNo: billNo,
        FirstName: patientData?.firstName || patientData?.name?.split(' ')[0] || 'Patient',
        LastName: patientData?.lastName || patientData?.name?.split(' ').slice(1).join(' ') || 'Name',
        Gender: patientData?.gender || 'Male',
        DateOfBirth: patientData?.dateOfBirth || '1990-01-01',
        Age: patientData?.age || calculateAge(patientData?.dateOfBirth || '1990-01-01').toString(),
        TelephoneNo: patientData?.phone || '0700000000',
        PatientFileNo: patientData?.patientId || `PAT${Date.now()}`,
        PatientFile: patientData?.patientId || `PAT${Date.now()}`,
        AuthorizationNo: authorizationNo,
        AttendanceDate: currentDate.toISOString().split('T')[0],
        PatientTypeCode: 'OP', // Outpatient
        DateAdmitted: null,
        DateDischarged: null,
        PractitionerNo: doctorData?.practitionerNo || doctorData?.id || 'DENT001',
        CreatedBy: doctorData?.name || 'Dental System',
        DateCreated: currentDate.toISOString().split('T')[0],
        LastModifiedBy: doctorData?.name || 'Dental System',
        LastModified: currentDate.toISOString().split('T')[0],
        FolioDiseases: [{
          DiseaseCode: 'K02', // Dental caries - default dental diagnosis
          Remarks: payload.diagnosisRemarks || null,
          Status: 'Active',
          CreatedBy: doctorData?.name || 'Dental System',
          DateCreated: currentDate.toISOString().split('T')[0],
          LastModifiedBy: doctorData?.name || 'Dental System',
          LastModified: currentDate.toISOString().split('T')[0]
        }],
        FolioItems: treatments.map((treatment: any, index: number) => ({
          ItemCode: treatment.code || treatment.id || `ITEM${index + 1}`,
          OtherDetails: treatment.description || treatment.name || null,
          ItemQuantity: treatment.quantity || 1,
          UnitPrice: (treatment.unitPrice || treatment.basePrice || 0).toString(),
          AmountClaimed: (treatment.totalPrice || treatment.basePrice || 0).toString(),
          ApprovalRefNo: null,
          CreatedBy: doctorData?.name || 'Dental System',
          DateCreated: currentDate.toISOString().split('T')[0],
          LastModifiedBy: doctorData?.name || 'Dental System',
          LastModified: currentDate.toISOString().split('T')[0]
        })),
        ClaimFile: payload.claimFile || null,
        ProviderID: Deno.env.get('JUBILEE_PROVIDER_ID') || '11665468',
        ClinicalNotes: payload.clinicalNotes || 'Routine dental treatment',
        DelayReason: null,
        LateAuthorizationReason: null,
        AmountClaimed: totalAmount.toString(),
        EmergencyAuthorizationReason: null,
        LateSubmissionReason: null
      }]
    }

    console.log('📡 Sending request to Jubilee API...')

    // Choose endpoint based on submission type
    const endpoint = submissionType === 'claim' 
      ? 'https://cmsuat.jubileetanzania.co.tz/jubileeapi/SendClaim'
      : 'https://cmsuat.jubileetanzania.co.tz/jubileeapi/SendPreauthorization'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jubileePayload),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log(`✅ ${submissionType} completed:`, result.Status)

    // Log submission in database
    const { error: logError } = await supabase
      .from('jubilee_submissions')
      .insert({
        member_no: memberNo,
        authorization_no: authorizationNo,
        submission_type: submissionType,
        bill_no: billNo,
        folio_no: folioNo,
        total_amount: parseFloat(totalAmount),
        patient_data: patientData,
        doctor_data: doctorData,
        treatments: treatments,
        submission_status: result.Status,
        submission_id: result.SubmissionID || null,
        submission_response: result,
        submitted_at: new Date().toISOString()
      })

    if (logError) {
      console.warn(`⚠️ Failed to log ${submissionType}:`, logError.message)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...result,
          billNo,
          folioNo,
          submissionType
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error(`❌ ${req.method} error:`, error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Submission failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}