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

// Defaults provided by client for GA Smart integration
const DEFAULT_PAYER_CODE = "GA";
const DEFAULT_PROVIDER_CODE = "SD_DENTAL";
const DEFAULT_SP_ID = "1";

// Restrict proxying to allowed API paths only
const ALLOWED_PATHS = [
  "/api/visit",
  "/api/diagnosis",
  "/api/final-claim",
  "/api/interim-claim",
  "/api/admission",
  "/api/discharge",
  "/api/claims",
  "/api/member",
  "/api/benefits",
];

function isAllowedPath(path: string) {
  return ALLOWED_PATHS.some((p) => path.startsWith(p));
}

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

async function postJson(path: string, body: unknown, params?: Record<string, unknown>) {
  const { token, type } = await getAccessToken();
  const url = buildApiUrl(path, params as Record<string, string>);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `${type} ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SMART API POST ${path} failed: ${res.status} ${txt}`);
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

    // Fetch Smart session for a patient (card swipe result)
    // Fetch Smart session for a patient (card swipe result)
    if (action === "get_session") {
      const patientNumber = payload?.patientNumber as string;
      const status = payload?.sessionStatus as string | undefined;
      if (!patientNumber) return json({ error: "patientNumber is required" }, 400);
      const data = await fetchJson("/api/visit", { patientNumber, sessionStatus: status ?? "PENDING" });
      return json({ ok: true, data });
    }

    // Link Smart session to hospital visit number
    if (action === "link_session") {
      const visitNumber = payload?.visitNumber as string;
      const sessionId = payload?.sessionId as string;
      if (!visitNumber || !sessionId) return json({ error: "visitNumber and sessionId are required" }, 400);
      const body = { visit_number: visitNumber, session_id: sessionId };
      const data = await postJson("/api/visit/link", body);
      return json({ ok: true, data });
    }

    // Post ICD-10 diagnosis
    if (action === "post_diagnosis") {
      const diagnosis = payload?.diagnosis as Record<string, unknown> | undefined;
      if (!diagnosis) return json({ error: "diagnosis body is required" }, 400);
      (diagnosis as any).payer_code ??= DEFAULT_PAYER_CODE;
      (diagnosis as any).provider_code ??= DEFAULT_PROVIDER_CODE;
      (diagnosis as any).sp_id ??= DEFAULT_SP_ID;
      const data = await postJson("/api/diagnosis", diagnosis);
      return json({ ok: true, data });
    }

    if (action === "submit_final_claim") {
      const claim = payload?.claim as Record<string, unknown> | undefined;
      if (!claim) return json({ error: "claim body is required" }, 400);
      (claim as any).payer_code ??= DEFAULT_PAYER_CODE;
      (claim as any).provider_code ??= DEFAULT_PROVIDER_CODE;
      (claim as any).sp_id ??= DEFAULT_SP_ID;
      const data = await postJson("/api/final-claim", claim);
      return json({ ok: true, data });
    }

    if (action === "submit_interim_claim") {
      const claim = payload?.claim as Record<string, unknown> | undefined;
      if (!claim) return json({ error: "claim body is required" }, 400);
      (claim as any).payer_code ??= DEFAULT_PAYER_CODE;
      (claim as any).provider_code ??= DEFAULT_PROVIDER_CODE;
      (claim as any).sp_id ??= DEFAULT_SP_ID;
      const data = await postJson("/api/interim-claim", claim);
      return json({ ok: true, data });
    }

    if (action === "submit_admission") {
      const admission = payload?.admission as Record<string, unknown> | undefined;
      if (!admission) return json({ error: "admission body is required" }, 400);
      const data = await postJson("/api/admission", admission);
      return json({ ok: true, data });
    }

    if (action === "submit_discharge") {
      const discharge = payload?.discharge as Record<string, unknown> | undefined;
      if (!discharge) return json({ error: "discharge body is required" }, 400);
      const data = await postJson("/api/discharge", discharge);
      return json({ ok: true, data });
    }

    if (action === "claim_status") {
      const claimId = payload?.claimId as string;
      if (!claimId) return json({ error: "claimId is required" }, 400);
      const data = await fetchJson(`/api/claims/${encodeURIComponent(claimId)}/status`);
      return json({ ok: true, data });
    }

    // Safe general-purpose proxy for allowed SMART paths
    if (action === "smart_request") {
      const method = String(payload?.method || "GET").toUpperCase();
      const path = payload?.path as string;
      const params = payload?.params as Record<string, unknown> | undefined;
      const body = payload?.body as unknown;
      if (!path || !isAllowedPath(path)) return json({ error: "Invalid or disallowed path" }, 400);
      const data = method === "POST" ? await postJson(path, body, params) : await fetchJson(path, params);
      return json({ ok: true, data });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("smart-ga error:", error);
    return json({ error: String(error?.message || error) }, 500);
  }
});
