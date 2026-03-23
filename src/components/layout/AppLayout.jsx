import { Sidebar } from './Sidebar'
import { cn } from '../../lib/cn'

/**
 * @param {{
 *   children: import('react').ReactNode
 *   onOpenSettings?: () => void
 *   paddedMain?: boolean
 * }} props
 */
export function AppLayout({
  children,
  onOpenSettings,
  paddedMain = true,
}) {
  return (
    <div className="flex h-svh w-full overflow-hidden bg-white text-gray-900 antialiased">
      <Sidebar onOpenSettings={onOpenSettings} />
      <main
        id="main-content"
        className={cn(
          'min-h-0 min-w-0 flex-1 bg-gray-50',
          paddedMain &&
            'flex flex-col overflow-y-auto overflow-x-hidden px-6 py-7 md:px-10 md:py-9',
          !paddedMain && 'flex flex-col overflow-hidden',
        )}
      >
        {paddedMain ? (
          <div
            className="mb-6 rounded-xl border border-violet-100 bg-violet-50/90 px-4 py-3 text-[12px] leading-relaxed text-violet-950 shadow-sm"
            role="status"
          >
            <span className="font-semibold text-violet-900">Local-first · 隐私</span>
            <span className="text-violet-800/95">
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
