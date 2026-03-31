import { createElement } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Briefcase,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Layers,
  LogIn,
  Settings,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { appPath } from '../../lib/appPaths'
import { useAuth } from '../../contexts/AuthContext.jsx'

const NAV_ITEMS = [
  { id: 'experiences', label: '个人信息库', path: appPath('experiences'), icon: Layers },
  { id: 'resume', label: '简历生成中心', path: appPath('resume'), icon: Briefcase },
  { id: 'jobs', label: '岗位库', path: appPath('jobs'), icon: Building2 },
  {
    id: 'dashboard',
    label: '指挥部',
    path: appPath('dashboard'),
    icon: LayoutDashboard,
  },
  { id: 'interview', label: '专项面试', path: appPath('interview'), icon: ClipboardList },
]

/**
 * @param {{ path: string }} a
 * @param {string} pathname
 */
function isNavActive(path, pathname) {
  if (path === appPath('interview')) {
    return pathname === path || pathname.startsWith(`${path}/`)
  }
  return pathname === path || pathname.startsWith(`${path}/`)
}

/**
 * @param {{
 *   onOpenSettings?: () => void
 *   onOpenGuide?: () => void
 *   onNavigate?: () => void
 * }} props
 */
export function Sidebar({ onOpenSettings, onOpenGuide, onNavigate }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const {
    user,
    loading,
    signOut,
    isSupabaseConfigured,
    lastCloudSyncAt,
  } = useAuth()

  const syncHint =
    isSupabaseConfigured && user
      ? lastCloudSyncAt
        ? `云端已同步 · ${new Date(lastCloudSyncAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
        : '云端已同步'
      : '本地模式'

  return (
    <aside
      className="relative z-10 flex w-56 shrink-0 flex-col border-r border-zinc-200/80 bg-[#f9f8f6]/95 backdrop-blur-sm"
      aria-label="应用侧栏"
    >
      <header className="border-b border-zinc-200/85 px-6 py-6">
        <Link
          to="/"
          className="block rounded-md text-left outline-none ring-zinc-300 transition hover:text-zinc-900 focus-visible:ring-2"
        >
          <div className="font-editorial text-[18px] font-medium tracking-tight text-zinc-900">
            CareerStack
          </div>
          <p className="mt-1 text-[11px] leading-relaxed tracking-wide text-zinc-500">
            本地求职工作台
          </p>
        </Link>
      </header>

      <nav className="px-3 py-5" aria-label="主导航">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ id, label, path, icon }) => {
            const active = isNavActive(path, pathname)
            const content = (
              <>
                {createElement(icon, {
                  className: [
                    'size-[18px] shrink-0',
                    active ? 'text-[var(--color-accent)]' : 'text-zinc-400',
                  ].join(' '),
                  strokeWidth: 1.5,
                  'aria-hidden': true,
                })}
                <span>{label}</span>
              </>
            )
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.()
                    navigate(path)
                  }}
                  className={[
                    'flex w-full items-center gap-2.5 border border-transparent px-3 py-2.5 text-left text-sm transition-colors duration-200',
                    active
                      ? 'border-zinc-200/90 bg-white/90 font-medium text-zinc-900 shadow-[0_6px_20px_rgba(12,12,12,0.04)]'
                      : 'text-zinc-600 hover:border-zinc-200/70 hover:bg-white/70 hover:text-zinc-800',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  {content}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-zinc-200/80 p-3">
        <p className="px-3 pb-2 text-[10px] leading-relaxed text-zinc-400" title={syncHint}>
          {syncHint}
        </p>
        {!loading && !user ? (
          <Link
            to="/login"
            className="mb-1 flex w-full items-center gap-2.5 border border-transparent px-3 py-2.5 text-left text-sm text-zinc-600 transition-colors duration-200 hover:border-zinc-200/70 hover:bg-white/70 hover:text-zinc-800"
          >
            <LogIn className="size-[18px] shrink-0 text-zinc-400" strokeWidth={1.5} aria-hidden />
            <span>登录 / 注册</span>
          </Link>
        ) : !loading && user ? (
          <div className="mb-2 space-y-1 px-3">
            <p className="truncate text-[11px] text-zinc-500" title={user.email ?? ''}>
              {user.email}
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline"
            >
              退出登录
            </button>
          </div>
        ) : null}
        <div className="flex flex-col gap-0.5">
          {onOpenGuide ? (
            <button
              type="button"
              onClick={onOpenGuide}
              className="flex w-full items-center gap-2.5 border border-transparent px-3 py-2.5 text-left text-sm text-zinc-600 transition-colors duration-200 hover:border-zinc-200/70 hover:bg-white/70 hover:text-zinc-800"
            >
              <BookOpen className="size-[18px] shrink-0 text-zinc-400" strokeWidth={1.5} aria-hidden />
              <span>使用说明</span>
            </button>
          ) : null}
          {onOpenSettings ? (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex w-full items-center gap-2.5 border border-transparent px-3 py-2.5 text-left text-sm text-zinc-600 transition-colors duration-200 hover:border-zinc-200/70 hover:bg-white/70 hover:text-zinc-800"
            >
              <Settings className="size-[18px] shrink-0 text-zinc-400" strokeWidth={1.5} aria-hidden />
              <span>设置</span>
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
