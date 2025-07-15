import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const jubileeUsername = Deno.env.get('JUBILEE_USERNAME')
    const jubileePassword = Deno.env.get('JUBILEE_PASSWORD')
    const jubileeProviderId = Deno.env.get('JUBILEE_PROVIDER_ID')

    if (!jubileeUsername || !jubileePassword || !jubileeProviderId) {
      throw new Error('Missing Jubilee credentials in environment variables')
    }

    return new Response(
      JSON.stringify({
        username: jubileeUsername,
        password: jubileePassword,
        providerId: jubileeProviderId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})