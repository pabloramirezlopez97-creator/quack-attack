import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Esto se ve en la consola del navegador si olvidaste configurar el archivo .env
  console.error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa tu archivo .env (mira .env.example)."
  );
}

export const supabase = createClient(url, anonKey);

// Asegura que cada dispositivo tenga una sesión anónima (sin registro, sin contraseña)
export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    await supabase.auth.signInAnonymously();
  }
  const { data: data2 } = await supabase.auth.getSession();
  return data2.session;
}
