import { createClient } from '@supabase/supabase-js'

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl = (() => {
  try {
    return new URL(configuredSupabaseUrl).origin
  } catch {
    return configuredSupabaseUrl
  }
})()

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)