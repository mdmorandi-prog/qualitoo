import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export { corsHeaders };

/**
 * Standardized authentication helper for all edge functions.
 * Validates the JWT token using getClaims() and returns the authenticated user's claims.
 * 
 * @param authHeader - The Authorization header from the request
 * @returns Object with userClient (Supabase client scoped to user) and claims (JWT claims including sub, email, etc.)
 * @throws Error if authentication fails
 */
export async function requireAuth(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid authorization header", 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);

  if (claimsError || !claimsData?.claims?.sub) {
    throw new AuthError("Invalid or expired token", 401);
  }

  return {
    userClient,
    claims: claimsData.claims,
    userId: claimsData.claims.sub as string,
  };
}

export class AuthError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AuthError";
  }
}

/**
 * Creates an unauthorized response with CORS headers.
 */
export function unauthorizedResponse(message = "Não autorizado") {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
