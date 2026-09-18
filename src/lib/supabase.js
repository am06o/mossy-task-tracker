import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// .env에 키를 아직 안 넣었을 때도 앱 자체는 뜨게 하고, 화면에서 "설정 필요" 안내를 보여준다.
export const supabaseConfigured = Boolean(url && anonKey)

export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
  : null
