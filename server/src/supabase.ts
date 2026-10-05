import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("your-supabase-project")
  );
};

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    console.log("Connected to Supabase at:", supabaseUrl);
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
} else {
  console.log("ℹ️ Supabase credentials not found or placeholder; running with Local Storage & In-Memory DB fallback.");
}
