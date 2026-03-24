import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** 是否已配置环境变量（未配置时云端功能关闭，本地仍可用） */
export const isSupabaseConfigured = Boolean(
  url && typeof url === 'string' && url.length > 0 && anonKey && typeof anonKey === 'string' && anonKey.length > 0,
)

/**
 * Supabase 浏览器客户端。未配置时导出 `null`，调用方需先判断 `isSupabaseConfigured`。
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null
