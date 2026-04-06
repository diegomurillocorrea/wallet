const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL

const getSupabaseAnonKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

export const getSupabaseConfig = () => {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y una clave pública (ANON o PUBLISHABLE) en .env"
    )
  }
  return { url, key }
}
