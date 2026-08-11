import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "VITE_SUPABASE_URL belum tersedia. Periksa Environment Variables di Vercel."
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    "VITE_SUPABASE_PUBLISHABLE_KEY belum tersedia. Periksa Environment Variables di Vercel."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
