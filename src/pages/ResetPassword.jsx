import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useToast } from '../contexts/ToastContext.jsx'
import { APP_BASE } from '../lib/appPaths'

export function ResetPassword() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { updateNewPassword, isSupabaseConfigured, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim()) return
    if (password !== confirm) {
      showToast('两次输入的密码不一致', 'error')
      return
    }
    setSubmitting(true)
    try {
      await updateNewPassword(password)
      showToast('密码已更新', 'success')
      navigate('/', { replace: true })
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
          <h1 className="text-center text-xl font-bold tracking-tight text-slate-900">重置密码</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">
            请设置新密码。若未从邮件链接进入，请先申请「忘记密码」。
          </p>

          {!isSupabaseConfigured ? (
            <p className="mt-6 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-center text-sm text-amber-900">
              未配置 Supabase 环境变量，无法在线重置密码。
            </p>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
              <div>
                <label htmlFor="reset-password" className="mb-1 block text-xs font-medium text-slate-600">
                  新密码
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <input
                    id="reset-password"
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
                <label htmlFor="reset-password-confirm" className="mb-1 block text-xs font-medium text-slate-600">
                  确认新密码
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <input
                    id="reset-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
                {submitting ? '处理中…' : '确认修改'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
