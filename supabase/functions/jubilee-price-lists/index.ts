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
    const listType = url.searchParams.get('type') || 'price' // 'price' or 'procedure'
    
    console.log(`🔍 Fetching ${listType} list from Jubilee API...`)

    // Get valid access token
    const accessToken = await getValidToken()

    // Choose endpoint based on list type
    const endpoint = listType === 'procedure'
      ? 'https://cmsuat.jubileetanzania.co.tz/jubileeapi/GetProcedureList'
      : 'https://cmsuat.jubileetanzania.co.tz/jubileeapi/GetPriceList'

    console.log('📡 Fetching from Jubilee API...')

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const listData = await response.json()
    console.log(`✅ ${listType} list retrieved successfully`)

    // Cache the list in database for performance
    const { error: cacheError } = await supabase
      .from('jubilee_price_lists')
      .upsert({
        list_type: listType,
        list_data: listData,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'list_type'
      })

    if (cacheError) {
      console.warn('⚠️ Failed to cache list in database:', cacheError.message)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          listType,
          ...listData
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Price list fetch error:', error)
    
    // Try to return cached data if API fails
    try {
      const url = new URL(req.url)
      const listType = url.searchParams.get('type') || 'price'
      
      const { data: cachedData } = await supabase
        .from('jubilee_price_lists')
        .select('*')
        .eq('list_type', listType)
        .single()

      if (cachedData) {
        console.log('📦 Returning cached data due to API failure')
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              listType,
              ...cachedData.list_data,
              cached: true,
              lastUpdated: cachedData.last_updated
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    } catch (cacheError) {
      console.error('Failed to retrieve cached data:', cacheError)
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch price list'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})