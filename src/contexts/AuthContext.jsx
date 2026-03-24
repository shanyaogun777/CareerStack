import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import {
  fetchUserBackupRow,
  restoreLocalFromPayload,
  uploadUserBackup,
} from '../services/cloudBackup.js'
import { useToast } from './ToastContext.jsx'

/**
 * @typedef {{
 *   session: import('@supabase/supabase-js').Session | null
 *   user: import('@supabase/supabase-js').User | null
 *   loading: boolean
 *   isSupabaseConfigured: boolean
 *   lastCloudSyncAt: number | null
 *   pendingRestore: null | { updatedAt: string; payload: unknown }
 *   signInWithMagicLink: (email: string) => Promise<void>
 *   signInWithPassword: (email: string, password: string) => Promise<void>
 *   signUp: (email: string, password: string) => Promise<{ session: import('@supabase/supabase-js').Session | null }>
 *   sendPasswordReset: (email: string) => Promise<void>
 *   updateNewPassword: (newPassword: string) => Promise<void>
 *   signOut: () => Promise<void>
 *   dismissPendingRestore: () => void
 *   confirmRestoreFromCloud: () => Promise<void>
 *   skipRestoreAndUpload: () => Promise<void>
 *   syncToCloud: () => Promise<void>
 * }} AuthContextValue
 */

const AuthContext = createContext(
  /** @type {AuthContextValue} */ ({
    session: null,
    user: null,
    loading: true,
    isSupabaseConfigured: false,
    lastCloudSyncAt: null,
    pendingRestore: null,
    signInWithMagicLink: async () => {},
    signInWithPassword: async () => {},
    signUp: async () => ({ session: null }),
    sendPasswordReset: async () => {},
    updateNewPassword: async () => {},
    signOut: async () => {},
    dismissPendingRestore: () => {},
    confirmRestoreFromCloud: async () => {},
    skipRestoreAndUpload: async () => {},
    syncToCloud: async () => {},
  }),
)

function restoreResolvedKey(userId) {
  return `careerstack_restore_resolved_${userId}`
}

/**
 * Magic Link / 密码登录成功后离开 /login（重置密码页由 ResetPassword 自行 navigate，避免打断 Toast）。
 * @param {string} event
 */
function redirectToHomeAfterAuth(event) {
  if (typeof window === 'undefined') return
  const p = window.location.pathname
  if (p !== '/login') return
  if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
    window.location.replace('/')
  }
}

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function AuthProvider({ children }) {
  const { showToast } = useToast()
  const [session, setSession] = useState(
    /** @type {import('@supabase/supabase-js').Session | null} */ (null),
  )
  const [loading, setLoading] = useState(
    () => Boolean(isSupabaseConfigured && supabase),
  )
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState(/** @type {number | null} */ (null))
  const [pendingRestore, setPendingRestore] = useState(
    /** @type {null | { updatedAt: string; payload: unknown }} */ (null),
  )
  const flowLockRef = useRef(/** @type {string | null} */ (null))

  const user = session?.user ?? null

  const runPostLoginFlow = useCallback(
    async (
      /** @type {import('@supabase/supabase-js').Session} */ s,
      /** @type {string} */ eventName,
    ) => {
      const uid = s.user?.id
      if (!uid || !isSupabaseConfigured) return

      if (eventName === 'TOKEN_REFRESHED') return

      if (
        eventName === 'INITIAL_SESSION' &&
        typeof window !== 'undefined' &&
        window.location.pathname === '/reset-password'
      ) {
        return
      }

      const lockKey = `${uid}:${eventName}`
      if (flowLockRef.current === lockKey) return
      flowLockRef.current = lockKey
      window.setTimeout(() => {
        if (flowLockRef.current === lockKey) flowLockRef.current = null
      }, 1500)

      try {
        if (typeof sessionStorage !== 'undefined') {
          if (sessionStorage.getItem(restoreResolvedKey(uid))) {
            return
          }
        }

        const row = await fetchUserBackupRow(uid)
        if (row?.payload) {
          setPendingRestore({ updatedAt: row.updated_at, payload: row.payload })
          return
        }

        await uploadUserBackup(uid)
        setLastCloudSyncAt(Date.now())
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(restoreResolvedKey(uid), 'synced')
        }
        showToast('已同步到云端', 'success')
      } catch (e) {
        showToast(e instanceof Error ? e.message : '云端操作失败', 'error')
      }
    },
    [showToast],
  )

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s)
      setLoading(false)

      if (event === 'SIGNED_OUT') {
        setPendingRestore(null)
        setLastCloudSyncAt(null)
        flowLockRef.current = null
        return
      }

      if (event === 'PASSWORD_RECOVERY') {
        if (typeof window !== 'undefined' && window.location.pathname !== '/reset-password') {
          const { search, hash } = window.location
          window.location.replace(`${window.location.origin}/reset-password${search}${hash}`)
        }
        return
      }

      if (!s?.user) return

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        await runPostLoginFlow(s, event)
        redirectToHomeAfterAuth(event)
      }
    })

    return () => subscription.unsubscribe()
  }, [runPostLoginFlow])

  const signInWithMagicLink = useCallback(
    async (email) => {
      if (!isSupabaseConfigured || !supabase) {
        showToast('未配置 Supabase 环境变量', 'error')
        return
      }
      const redirectTo = `${window.location.origin}/login`
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      })
      if (error) {
        showToast(error.message, 'error')
        throw error
      }
      showToast('登录链接已发送至邮箱，请查收', 'success')
    },
    [showToast],
  )

  const signInWithPassword = useCallback(
    async (email, password) => {
      if (!isSupabaseConfigured || !supabase) {
        showToast('未配置 Supabase 环境变量', 'error')
        return
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        showToast(error.message, 'error')
        throw error
      }
      showToast('登录成功', 'success')
    },
    [showToast],
  )

  const signUp = useCallback(
    async (email, password) => {
      if (!isSupabaseConfigured || !supabase) {
        showToast('未配置 Supabase 环境变量', 'error')
        return { session: null }
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })
      if (error) {
        showToast(error.message, 'error')
        throw error
      }
      if (!data.session) {
        showToast('注册成功，请前往邮箱确认后再登录', 'success')
        return { session: null }
      }
      showToast('注册成功', 'success')
      return { session: data.session }
    },
    [showToast],
  )

  const sendPasswordReset = useCallback(
    async (email) => {
      if (!isSupabaseConfigured || !supabase) {
        showToast('未配置 Supabase 环境变量', 'error')
        return
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        showToast(error.message, 'error')
        throw error
      }
      showToast('重置邮件已发送，请查收', 'success')
    },
    [showToast],
  )

  const updateNewPassword = useCallback(
    async (newPassword) => {
      if (!isSupabaseConfigured || !supabase) {
        showToast('未配置 Supabase 环境变量', 'error')
        throw new Error('未配置 Supabase')
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        showToast(error.message, 'error')
        throw error
      }
    },
    [showToast],
  )

  const signOut = useCallback(async () => {
    if (!supabase) {
      showToast('未配置 Supabase，无法退出云端会话', 'error')
      return
    }

    // 先同步清空本地会话状态，避免网络等待或监听器延迟导致「点击无反应」
    setSession(null)
    setLoading(false)
    setPendingRestore(null)
    setLastCloudSyncAt(null)
    flowLockRef.current = null
    if (typeof sessionStorage !== 'undefined') {
      const keys = Object.keys(sessionStorage)
      for (const k of keys) {
        if (k.startsWith('careerstack_restore_resolved_')) sessionStorage.removeItem(k)
      }
    }
    showToast('已退出登录', 'default')

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        const { error: localErr } = await supabase.auth.signOut({ scope: 'local' })
        if (localErr) showToast(localErr.message, 'error')
      }
    } catch (e) {
      try {
        const { error: localErr } = await supabase.auth.signOut({ scope: 'local' })
        if (localErr) showToast(localErr.message, 'error')
      } catch {
        showToast(e instanceof Error ? e.message : '退出失败', 'error')
      }
    }
  }, [showToast])

  const dismissPendingRestore = useCallback(() => {
    setPendingRestore(null)
  }, [])

  const confirmRestoreFromCloud = useCallback(async () => {
    if (!pendingRestore || !user?.id) return
    const uid = /** @type {string} */ (user.id)
    try {
      await restoreLocalFromPayload(pendingRestore.payload)
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(restoreResolvedKey(uid), 'restore')
      }
      setPendingRestore(null)
      showToast('已恢复云端备份，即将刷新…', 'success')
      window.setTimeout(() => window.location.reload(), 600)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '恢复失败', 'error')
    }
  }, [pendingRestore, user, showToast])

  const skipRestoreAndUpload = useCallback(async () => {
    if (!user?.id) return
    const uid = /** @type {string} */ (user.id)
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(restoreResolvedKey(uid), 'skip')
      }
      setPendingRestore(null)
      await uploadUserBackup(uid)
      setLastCloudSyncAt(Date.now())
      showToast('已用本地数据覆盖云端备份', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '同步失败', 'error')
    }
  }, [user, showToast])

  const syncToCloud = useCallback(async () => {
    if (!user?.id) {
      showToast('请先登录', 'error')
      return
    }
    try {
      await uploadUserBackup(/** @type {string} */ (user.id))
      setLastCloudSyncAt(Date.now())
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(
          restoreResolvedKey(/** @type {string} */ (user.id)),
          'synced',
        )
      }
      showToast('云端已同步', 'success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '同步失败'
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('Network request failed')
      ) {
        showToast('网络异常，请稍后重试', 'error')
      } else {
        showToast(msg, 'error')
      }
    }
  }, [user, showToast])

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      isSupabaseConfigured,
      lastCloudSyncAt,
      pendingRestore,
      signInWithMagicLink,
      signInWithPassword,
      signUp,
      sendPasswordReset,
      updateNewPassword,
      signOut,
      dismissPendingRestore,
      confirmRestoreFromCloud,
      skipRestoreAndUpload,
      syncToCloud,
    }),
    [
      session,
      user,
      loading,
      lastCloudSyncAt,
      pendingRestore,
      signInWithMagicLink,
      signInWithPassword,
      signUp,
      sendPasswordReset,
      updateNewPassword,
      signOut,
      dismissPendingRestore,
      confirmRestoreFromCloud,
      skipRestoreAndUpload,
      syncToCloud,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- context consumer hook
export function useAuth() {
  return useContext(AuthContext)
}
