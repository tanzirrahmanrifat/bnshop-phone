function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Add it in Vercel → Settings → Environment Variables (tick Production), then redeploy. Locally: copy .env.example to .env.local.`,
    );
  }
  return value;
}

// Supabase's newer dashboards call the browser key "publishable" and the server key "secret".
// Both the new and the legacy names are accepted.
export const SUPABASE_URL = () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = () =>
  required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
export const SUPABASE_SERVICE_KEY = () =>
  required(
    "SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
  );
export const SITE_URL = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
