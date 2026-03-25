import { Sidebar } from './Sidebar'
import { cn } from '../../lib/cn'

/**
 * @param {{
 *   children: import('react').ReactNode
 *   onOpenSettings?: () => void
 *   onOpenGuide?: () => void
 *   onNavigate?: () => void
 *   paddedMain?: boolean
 * }} props
 */
export function AppLayout({
  children,
  onOpenSettings,
  onOpenGuide,
  onNavigate,
  paddedMain = true,
}) {
  return (
    <div className="flex h-svh w-full overflow-hidden bg-white font-sans text-slate-600 antialiased">
      <Sidebar
        onOpenSettings={onOpenSettings}
        onOpenGuide={onOpenGuide}
        onNavigate={onNavigate}
      />
      <main
        id="main-content"
        className={cn(
          'min-h-0 min-w-0 flex-1 bg-slate-50/80 leading-relaxed',
          paddedMain &&
            'flex flex-col overflow-y-auto overflow-x-hidden px-8 py-8 md:px-12 md:py-11',
          !paddedMain && 'flex flex-col overflow-hidden',
        )}
      >
        {paddedMain ? (
          <div
            className="mb-7 rounded-xl border border-slate-100 bg-slate-50/95 px-5 py-3.5 text-[12px] leading-relaxed text-slate-600 shadow-sm transition-colors duration-200"
            role="status"
          >
            <span className="font-semibold tracking-tight text-slate-800">Local-first · 隐私</span>
            <span className="text-slate-600">
              {' '}
              简历、岗位与素材默认只保存在本机浏览器的 IndexedDB，不会上传到 CareerStack
              服务器；AI 调用直连你配置的 API。
            </span>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  )
}
