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

interface JubileeAuthResponse {
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔐 Starting Jubilee authentication...')
    
    // Get Jubilee credentials from environment
    const jubileeUsername = Deno.env.get('JUBILEE_USERNAME')
    const jubileePassword = Deno.env.get('JUBILEE_PASSWORD')
    const jubileeProviderId = Deno.env.get('JUBILEE_PROVIDER_ID')

    if (!jubileeUsername || !jubileePassword || !jubileeProviderId) {
      throw new Error('Missing Jubilee credentials in environment variables')
    }

    // Create form data for authentication
    const formData = new FormData()
    formData.append('username', jubileeUsername)
    formData.append('password', jubileePassword)
    formData.append('providerid', jubileeProviderId)

    console.log('📡 Sending authentication request to Jubilee API...')
    
    // Make authentication request to Jubilee API
    const response = await fetch('https://cmsuat.jubileetanzania.co.tz/jubileeapi/Token', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const authData: JubileeAuthResponse = await response.json()
    console.log('✅ Jubilee authentication response received:', authData.Status)

    if (authData.Status === 'OK' && typeof authData.Description === 'object') {
      // Calculate expiry time in milliseconds
      const expiryTime = Date.now() + (authData.Description.expires_in * 1000)
      
      // Store token in database for future use
      const { error: dbError } = await supabase
        .from('jubilee_auth_tokens')
        .upsert({
          provider_id: authData.Description.provider_id,
          access_token: authData.Description.access_token,
          token_type: authData.Description.token_type,
          expires_at: new Date(expiryTime).toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'provider_id'
        })

      if (dbError) {
        console.warn('⚠️ Failed to store token in database:', dbError.message)
        // Don't fail the request if token storage fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            access_token: authData.Description.access_token,
            provider_id: authData.Description.provider_id,
            token_type: authData.Description.token_type,
            expires_in: authData.Description.expires_in,
            expires_at: expiryTime
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      throw new Error(typeof authData.Description === 'string' ? authData.Description : 'Authentication failed')
    }

  } catch (error) {
    console.error('❌ Jubilee authentication error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Authentication failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})