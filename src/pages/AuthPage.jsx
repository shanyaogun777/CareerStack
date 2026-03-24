import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { APP_BASE } from '../lib/appPaths'

export function AuthPage() {
  const { signInWithMagicLink, isSupabaseConfigured, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
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
          <h1 className="text-center text-xl font-bold tracking-tight text-slate-900">
            登录 / 注册
          </h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">
            使用邮箱收取一次性登录链接，无需密码。
          </p>

          {!isSupabaseConfigured ? (
            <p className="mt-6 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-center text-sm text-amber-900">
              未配置 <code className="text-xs">VITE_SUPABASE_URL</code> 与{' '}
              <code className="text-xs">VITE_SUPABASE_ANON_KEY</code>，云端登录不可用；本地功能仍可在工作台使用。
            </p>
          ) : (
            <>
              <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
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
                  发送 Magic Link
                </button>
              </form>

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
