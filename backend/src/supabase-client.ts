import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile();
} catch {
  // .env no existe (ej. en CI) — las env vars ya están seteadas por otro medio
}

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseServiceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno");
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
