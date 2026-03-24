import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useToast } from '../contexts/ToastContext.jsx'
import { APP_BASE } from '../lib/appPaths'

/** @typedef {'magic' | 'password' | 'register'} AuthMode */

export function Login() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const {
    signInWithMagicLink,
    signInWithPassword,
    signUp,
    sendPasswordReset,
    isSupabaseConfigured,
    loading,
  } = useAuth()

  /** @type {[AuthMode, import('react').Dispatch<import('react').SetStateAction<AuthMode>>]} */
  const [mode, setMode] = useState(/** @type {AuthMode} */ ('magic'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleMagicSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || submitting) return
    setSubmitting(true)
    try {
      await signInWithMagicLink(email)
      setEmail('')
    } catch {
      /* toast in context */
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password || submitting) return
    setSubmitting(true)
    try {
      await signInWithPassword(email, password)
      navigate('/', { replace: true })
    } catch {
      /* toast in context */
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password || submitting) return
    if (password !== passwordConfirm) {
      showToast('两次输入的密码不一致', 'error')
      return
    }
    setSubmitting(true)
    try {
      const { session } = await signUp(email, password)
      if (session) {
        navigate('/', { replace: true })
      }
    } catch {
      /* toast in context */
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim() || submitting) return
    setSubmitting(true)
    try {
      await sendPasswordReset(email)
    } catch {
      /* toast in context */
    } finally {
      setSubmitting(false)
    }
  }

  const title =
    mode === 'magic'
      ? '验证码登录'
      : mode === 'password'
        ? '密码登录'
        : '注册新账号'

  const subtitle =
    mode === 'magic'
      ? '使用邮箱收取一次性登录链接，无需密码。'
      : mode === 'password'
        ? '使用邮箱与密码登录。'
        : '设置邮箱与密码创建账号。'

  return (
    <div className="font-landing flex min-h-svh flex-col bg-[#fafbfc] text-slate-800 antialiased">
      <header className="border-b border-slate-100/80 bg-white/80 px-5 py-4 backdrop-blur-md md:px-10">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link to="/" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            ← 返回首页
          </Link>
          <Link
            to={APP_BASE}
            className="text-sm font-medium text-indigo-500/90 transition hover:text-indigo-600"
          >
            进入工作台
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-5 py-16">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <h1 className="text-center text-xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">{subtitle}</p>

          {/* 模式切换 */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setMode('magic')}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-medium transition',
                mode === 'magic'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80',
              ].join(' ')}
            >
              验证码登录
            </button>
            <button
              type="button"
              onClick={() => setMode('password')}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-medium transition',
                mode === 'password'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80',
              ].join(' ')}
            >
              密码登录
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-medium transition',
                mode === 'register'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80',
              ].join(' ')}
            >
              注册新账号
            </button>
          </div>

          {!isSupabaseConfigured ? (
            <p className="mt-6 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-center text-sm text-amber-900">
              未配置 <code className="text-xs">VITE_SUPABASE_URL</code> 与{' '}
              <code className="text-xs">VITE_SUPABASE_ANON_KEY</code>，云端登录不可用；本地功能仍可在工作台使用。
            </p>
          ) : (
            <>
              {mode === 'magic' ? (
                <form onSubmit={(e) => void handleMagicSubmit(e)} className="mt-8 space-y-4">
                  <div>
                    <label htmlFor="auth-email" className="mb-1 block text-xs font-medium text-slate-600">
                      邮箱
                    </label>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <input
                        id="auth-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-lg border border-slate-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-slate-700 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
                    ) : null}
                    {submitting ? '处理中…' : '发送 Magic Link'}
                  </button>
                </form>
              ) : null}

              {mode === 'password' ? (
                <form onSubmit={(e) => void handlePasswordSubmit(e)} className="mt-8 space-y-4">
                  <div>
                    <label htmlFor="pwd-email" className="mb-1 block text-xs font-medium text-slate-600">
                      邮箱
                    </label>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <input
                        id="pwd-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-lg border border-slate-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="pwd-password" className="mb-1 block text-xs font-medium text-slate-600">
                      密码
                    </label>
                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <input
                        id="pwd-password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleForgotPassword()}
                    disabled={submitting || loading}
                    className="text-xs font-medium text-indigo-500/90 underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    忘记密码？
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-slate-700 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
                    ) : null}
                    {submitting ? '处理中…' : '登录'}
                  </button>
                </form>
              ) : null}

              {mode === 'register' ? (
                <form onSubmit={(e) => void handleRegisterSubmit(e)} className="mt-8 space-y-4">
                  <div>
                    <label htmlFor="reg-email" className="mb-1 block text-xs font-medium text-slate-600">
                      邮箱
                    </label>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-lg border border-slate-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-password" className="mb-1 block text-xs font-medium text-slate-600">
                      密码
                    </label>
                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <input
                        id="reg-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-password2" className="mb-1 block text-xs font-medium text-slate-600">
                      确认密码
                    </label>
                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <input
                        id="reg-password2"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className="w-full rounded-lg border border-slate-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 text-sm font-medium tracking-wide text-white transition hover:bg-slate-700 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
                    ) : null}
                    {submitting ? '处理中…' : '立即注册'}
                  </button>
                </form>
              ) : null}

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-slate-400">
                  <span className="bg-white px-2">或</span>
                </div>
              </div>

              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-100 bg-slate-50 py-2.5 text-sm font-medium text-slate-400"
                title="暂未开放"
              >
                使用 GitHub 登录（即将开放）
              </button>

              <p className="mt-4 text-center text-xs text-slate-500">
                {mode === 'register' ? (
                  <>
                    已有账号？{' '}
                    <button
                      type="button"
                      onClick={() => setMode('password')}
                      className="font-medium text-indigo-500/90 underline-offset-2 hover:underline"
                    >
                      去登录
                    </button>
                  </>
                ) : (
                  <>
                    没有账号？{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="font-medium text-indigo-500/90 underline-offset-2 hover:underline"
                    >
                      立即注册
                    </button>
                  </>
                )}
              </p>
            </>
          )}

          <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-500">
            开启同步后，您的加密数据将备份至云端；不登录则数据仅保留在当前浏览器。
          </p>
        </div>
      </main>
    </div>
  )
}
