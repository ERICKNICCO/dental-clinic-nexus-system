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
    if (req.method !== 'GET') {
      throw new Error('Method not allowed')
    }

    const url = new URL(req.url)
    const submissionId = url.searchParams.get('submissionId')
    const type = url.searchParams.get('type') || 'preauth' // 'preauth' or 'claim'
    
    if (!submissionId) {
      throw new Error('Submission ID is required')
    }

    console.log(`🔍 Checking ${type} status for submission:`, submissionId)

    // Get valid access token
    const accessToken = await getValidToken()

    // Choose endpoint based on type
    const endpoint = type === 'claim'
      ? `https://cmsuat.jubileetanzania.co.tz/jubileeapi/getClaimStatus?submissionID=${submissionId}`
      : `https://cmsuat.jubileetanzania.co.tz/jubileeapi/getPreauthorizationStatus?submissionID=${submissionId}`

    console.log('📡 Fetching status from Jubilee API...')

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const statusResult = await response.json()
    console.log(`✅ ${type} status retrieved:`, statusResult.Status)

    // Update status in database
    const { error: updateError } = await supabase
      .from('jubilee_submissions')
      .update({
        current_status: statusResult.Status,
        status_response: statusResult,
        last_status_check: new Date().toISOString()
      })
      .eq('submission_id', submissionId)

    if (updateError) {
      console.warn('⚠️ Failed to update status in database:', updateError.message)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          submissionId,
          type,
          ...statusResult
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Status check error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Status check failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})