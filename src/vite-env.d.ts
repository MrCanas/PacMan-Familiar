/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del proyecto de Supabase. Sin ella el ranking no aparece. */
  readonly VITE_SUPABASE_URL?: string;
  /** Clave anónima de Supabase. Es pública por diseño; ver supabase/schema.sql. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
