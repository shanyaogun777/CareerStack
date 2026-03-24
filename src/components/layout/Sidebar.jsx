import { createElement } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
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
 * @param {{ onOpenSettings?: () => void }} props
 */
export function Sidebar({ onOpenSettings }) {
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
      className="flex w-56 shrink-0 flex-col border-r border-slate-100 bg-white"
      aria-label="应用侧栏"
    >
      <header className="border-b border-slate-100 px-6 py-6">
        <Link
          to="/"
          className="block rounded-md text-left outline-none ring-slate-300 transition hover:text-slate-900 focus-visible:ring-2"
        >
          <div className="text-[15px] font-semibold tracking-tight text-slate-800">
            CareerStack
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
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
                    active ? 'text-indigo-400/85' : 'text-slate-400',
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
                  onClick={() => navigate(path)}
                  className={[
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-200',
                    active
                      ? 'bg-slate-100/90 font-medium text-slate-800'
                      : 'text-slate-600 hover:bg-slate-50/90 hover:text-slate-800',
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

      <div className="mt-auto border-t border-slate-100 p-3">
        <p className="px-3 pb-2 text-[10px] leading-relaxed text-slate-400" title={syncHint}>
          {syncHint}
        </p>
        {!loading && !user ? (
          <Link
            to="/login"
            className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition-colors duration-200 hover:bg-slate-50/90 hover:text-slate-800"
          >
            <LogIn className="size-[18px] shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden />
            <span>登录 / 注册</span>
          </Link>
        ) : !loading && user ? (
          <div className="mb-2 space-y-1 px-3">
            <p className="truncate text-[11px] text-slate-500" title={user.email ?? ''}>
              {user.email}
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              退出登录
            </button>
          </div>
        ) : null}
        {onOpenSettings ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition-colors duration-200 hover:bg-slate-50/90 hover:text-slate-800"
          >
            <Settings className="size-[18px] shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden />
            <span>设置</span>
          </button>
        ) : null}
      </div>
    </aside>
  )
}
