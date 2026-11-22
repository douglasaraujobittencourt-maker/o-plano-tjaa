import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Projeto Supabase "O Plano" conectado a este app.
const SUPABASE_URL = "https://dewjutkjwovogmjwjevr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRld2p1dGtqd292b2dtandqZXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MjMyMzIsImV4cCI6MjEwNzA5OTIzMn0.V6dg6aF7sxuyZi9jv9gMh8_oww774fdDRKTZZwevGIg";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
  },
});
