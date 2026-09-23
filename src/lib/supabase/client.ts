"use client";

import { createBrowserClient } from "@supabase/ssr";

// Cliente de Supabase para usar en Client Components.
// Usa la publishable key, que solo tiene permiso de lectura pública
// según las policies de RLS definidas en supabase/migrations.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
