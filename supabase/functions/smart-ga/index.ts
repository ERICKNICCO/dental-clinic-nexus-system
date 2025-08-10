import "https://deno.land/x/xhr@0.4.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Read required secrets
const BASE_URL = Deno.env.get("SMART_BASE_URL") || "";
const CLIENT_ID = Deno.env.get("SMART_CLIENT_ID") || "";
const CLIENT_SECRET = Deno.env.get("SMART_CLIENT_SECRET") || "";
const USERNAME = Deno.env.get("SMART_USERNAME") || "";
const PASSWORD = Deno.env.get("SMART_PASSWORD") || "";

// Simple helper to respond
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Fetch access token; optionally use DB cache (via REST) to avoid importing client
async function getAccessToken(): Promise<{ token: string; type: string; expiresAt: number }> {
  // Always attempt to reuse a valid token from DB cache via REST
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/rest/v1/smart_auth_tokens?select=*&provider_id=eq.smart&order=expires_at.desc&limit=1`;
    const headers = {
      "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")}`,
    } as Record<string, string>;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0];
        const exp = new Date(row.expires_at).getTime();
        if (Date.now() < exp - 60_000) {
          return { token: row.access_token, type: row.token_type || "Bearer", expiresAt: exp };
        }
      }
    }
  } catch (_) {
    // fall through to fetch a new token
  }

  if (!BASE_URL || !CLIENT_ID || !CLIENT_SECRET || !USERNAME || !PASSWORD) {
    throw new Error("SMART API credentials are missing. Configure SMART_* secrets in Supabase.");
  }

  const tokenUrl = `${BASE_URL.replace(/\/$/, "")}/oauth/token`;
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    username: USERNAME,
    password: PASSWORD,
  });

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    throw new Error(`SMART token error: ${tokenRes.status} ${txt}`);
  }

  const tokenData = await tokenRes.json();
  const access_token = tokenData.access_token as string;
  const token_type = (tokenData.token_type as string) || "Bearer";
  const expires_in = Number(tokenData.expires_in ?? 3600);
  const expiresAt = Date.now() + expires_in * 1000;

  // Persist token to DB cache (best-effort)
  try {
    const insertUrl = `${Deno.env.get("SUPABASE_URL")}/rest/v1/smart_auth_tokens`;
    const headers = {
      "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    } as Record<string, string>;
    const payload = {
      provider_id: "smart",
      access_token,
      token_type,
      expires_at: new Date(expiresAt).toISOString(),
    };
    await fetch(insertUrl, { method: "POST", headers, body: JSON.stringify(payload) });
  } catch (_) {
    // ignore cache errors
  }

  return { token: access_token, type: token_type, expiresAt };
}

function buildApiUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const base = BASE_URL.replace(/\/$/, "");
  const url = new URL(`${base}${path.startsWith("/") ? "" : "/"}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function fetchJson(path: string, params?: Record<string, unknown>) {
  const { token, type } = await getAccessToken();
  const url = buildApiUrl(path, params as Record<string, string>);
  const res = await fetch(url, {
    headers: { Authorization: `${type} ${token}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SMART API ${path} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const action = payload?.action as string;

    if (action === "get_token") {
      const t = await getAccessToken();
      return json({ ok: true, expiresAt: t.expiresAt });
    }

    if (action === "verify_member") {
      const patientNumber = payload?.patientNumber as string;
      const sessionId = payload?.sessionId as string | undefined;
      if (!patientNumber) return json({ error: "patientNumber is required" }, 400);

      // If sessionId not provided, try to get a pending visit to obtain sessionId
      let effectiveSessionId = sessionId;
      if (!effectiveSessionId) {
        try {
          const visitResp = await fetchJson("/api/visit", {
            patientNumber,
            sessionStatus: "PENDING",
          });
          // Try to read sessionId field from response
          effectiveSessionId = visitResp?.sessionId ?? visitResp?.data?.sessionId ?? visitResp?.id ?? undefined;
        } catch (_) {
          // ignore; proceed without sessionId
        }
      }

      const member = await fetchJson("/api/member", {
        patientNumber,
        sessionId: effectiveSessionId,
      });

      let benefits: unknown = null;
      try {
        benefits = await fetchJson("/api/benefits", {
          patientNumber,
          sessionId: effectiveSessionId,
        });
      } catch (_) {
        // benefits optional
      }

      // Attempt to summarize minimal structure needed by UI
      const coverageInfo = { dentalCoverage: true };
      return json({ ok: true, member, benefits, coverageInfo, sessionId: effectiveSessionId });
    }

    if (action === "get_benefits") {
      const patientNumber = payload?.patientNumber as string;
      const sessionId = payload?.sessionId as string | undefined;
      if (!patientNumber) return json({ error: "patientNumber is required" }, 400);
      const data = await fetchJson("/api/benefits", { patientNumber, sessionId });
      return json({ ok: true, data });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("smart-ga error:", error);
    return json({ error: String(error?.message || error) }, 500);
  }
});
