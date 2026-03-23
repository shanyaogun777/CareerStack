import { createElement } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Layers,
  Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'experiences', label: '个人信息库', path: '/experiences', icon: Layers },
  { id: 'resume', label: '简历生成中心', path: '/resume', icon: Briefcase },
  { id: 'jobs', label: '岗位库', path: '/jobs', icon: Building2 },
  { id: 'dashboard', label: '指挥部', path: '/dashboard', icon: LayoutDashboard },
  { id: 'interview', label: '专项面试', path: '/interview', icon: ClipboardList },
]

/**
 * @param {{ path: string }} a
 * @param {string} pathname
 */
function isNavActive(path, pathname) {
  if (path === '/experiences') {
    return pathname === '/experiences' || pathname === '/'
  }
  if (path === '/interview') {
    return pathname.startsWith('/interview')
  }
  if (path === '/dashboard') {
    return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  }
  return pathname === path || pathname.startsWith(`${path}/`)
}

/**
 * @param {{ onOpenSettings?: () => void }} props
 */
export function Sidebar({ onOpenSettings }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <aside
      className="flex w-56 shrink-0 flex-col border-r border-gray-200/90 bg-white"
      aria-label="应用侧栏"
    >
      <header className="border-b border-gray-100 px-5 py-5">
        <div className="text-[15px] font-semibold tracking-tight text-gray-900">
          CareerStack
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          本地求职工作台
        </p>
      </header>

      <nav className="px-3 py-4" aria-label="主导航">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ id, label, path, icon }) => {
            const active = isNavActive(path, pathname)
            const content = (
              <>
                {createElement(icon, {
                  className: [
                    'size-[18px] shrink-0',
                    active ? 'text-gray-700' : 'text-gray-400',
                  ].join(' '),
                  strokeWidth: 1.75,
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
                    'flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                    active
                      ? 'bg-gray-100 font-medium text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
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

      <div className="mt-auto border-t border-gray-100 p-3">
        {onOpenSettings ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <Settings className="size-[18px] shrink-0 text-gray-400" strokeWidth={1.75} aria-hidden />
            <span>设置</span>
          </button>
        ) : null}
      </div>
    </aside>
  )
}
