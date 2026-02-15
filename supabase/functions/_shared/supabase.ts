import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

export function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length).trim();
  return token.length ? token : null;
}

export function createUserClient(jwt: string) {
  const url = getEnv("SUPABASE_URL");
  const anon = getEnv("SUPABASE_ANON_KEY");

  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });
}
