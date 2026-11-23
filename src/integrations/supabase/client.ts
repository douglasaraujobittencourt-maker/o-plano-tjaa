import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Projeto Supabase "O Plano" conectado a este app.
const SUPABASE_URL = "[https://uridzsdeonftfjqrpvse.supabase.co](https://uridzsdeonftfjqrpvse.supabase.co)";
const SUPABASE_ANON_KEY =
  "sb_publishable_lYBcVSbuInNNr7RjBBLpAw_ju5KVWaW";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
  },
});
