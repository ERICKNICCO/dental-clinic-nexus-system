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
    const { memberNo, benefitCode, verifyItems, amount, procedureCode } = payload
    
    if (!memberNo || !verifyItems || !amount) {
      throw new Error('Member number, items, and amount are required')
    }

    console.log('🔍 Verifying items for member:', memberNo)
    console.log('📦 Items to verify:', verifyItems.length)

    // Get valid access token
    const accessToken = await getValidToken()

    // Prepare verification payload
    const verificationPayload = {
      BenefitCode: benefitCode || '7927', // Default benefit code for outpatient
      MemberNo: memberNo,
      VerifyItems: verifyItems.map((item: any) => ({
        ItemId: item.itemId || item.ItemId,
        ItemQuantity: item.itemQuantity || item.ItemQuantity || '1',
        ItemPrice: item.itemPrice || item.ItemPrice || item.unitPrice?.toString()
      })),
      Amount: amount.toString(),
      Procedured: procedureCode || 'JIC0333' // Default procedure code
    }

    console.log('📡 Sending verification request to Jubilee API...')

    // Create form data for the request
    const formData = new FormData()
    Object.entries(verificationPayload).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, value as string)
      }
    })

    const response = await fetch('https://cmsuat.jubileetanzania.co.tz/jubileeapi/VerifyItems', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const verificationResult = await response.json()
    console.log('✅ Items verification completed:', verificationResult.Status)

    // Log verification attempt in database
    const { error: logError } = await supabase
      .from('jubilee_item_verifications')
      .insert({
        member_no: memberNo,
        benefit_code: benefitCode || '7927',
        procedure_code: procedureCode || 'JIC0333',
        items: verifyItems,
        total_amount: parseFloat(amount),
        verification_status: verificationResult.Status,
        verification_response: verificationResult,
        verified_at: new Date().toISOString()
      })

    if (logError) {
      console.warn('⚠️ Failed to log item verification:', logError.message)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: verificationResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Items verification error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Items verification failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})