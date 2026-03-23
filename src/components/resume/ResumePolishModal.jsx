import { Loader2, X } from 'lucide-react'
import { MarkdownPreview } from '../experiences/MarkdownPreview'
import { cn } from '../../lib/cn'

/**
 * @param {{
 *   open: boolean
 *   beforeMarkdown: string
 *   afterMarkdown: string
 *   loading: boolean
 *   error: string
 *   onClose: () => void
 *   onApply: () => void
 * }} props
 */
export function ResumePolishModal({
  open,
  beforeMarkdown,
  afterMarkdown,
  loading,
  error,
  onClose,
  onApply,
}) {
  if (!open) return null

  const canApply = !loading && !error && String(afterMarkdown).trim().length > 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-polish-title"
    >
      <div className="flex max-h-[min(92vh,880px)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-gray-200/80">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <h2 id="resume-polish-title" className="text-sm font-semibold text-gray-900">
            AI 润色 · 修改前后对比
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="关闭"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </header>

        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-sm text-gray-600">
            <Loader2 className="size-8 animate-spin text-violet-600" aria-hidden />
            <p>正在结合目标岗位 JD 按 STAR 润色，请稍候…</p>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="flex min-h-[200px] flex-col overflow-hidden md:min-h-[320px]">
              <div className="shrink-0 border-b border-gray-50 bg-gray-50/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                修改前
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-3">
                <div className="resume-md-surface rounded-md border border-gray-100 bg-white p-2">
                  <MarkdownPreview
                    markdown={beforeMarkdown}
                    compact
                    emptyHint="（空）"
                    className="[&_.prose]:text-[11px] [&_.prose]:leading-relaxed"
                  />
                </div>
                <details className="mt-2 resume-ui-only">
                  <summary className="cursor-pointer text-[10px] text-gray-500">查看 Markdown 源码</summary>
                  <pre className="mt-1 max-h-40 overflow-auto rounded border border-dashed border-gray-200 bg-gray-50 p-2 font-mono text-[10px] leading-relaxed text-gray-700">
                    {beforeMarkdown}
                  </pre>
                </details>
              </div>
            </div>
            <div className="flex min-h-[200px] flex-col overflow-hidden md:min-h-[320px]">
              <div className="shrink-0 border-b border-gray-50 bg-violet-50/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                修改后
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-3">
                {error ? (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                ) : (
                  <>
                    <div className="resume-md-surface rounded-md border border-violet-100 bg-white p-2">
                      <MarkdownPreview
                        markdown={afterMarkdown}
                        compact
                        emptyHint="（无输出）"
                        className="[&_.prose]:text-[11px] [&_.prose]:leading-relaxed"
                      />
                    </div>
                    <details className="mt-2 resume-ui-only">
                      <summary className="cursor-pointer text-[10px] text-gray-500">查看 Markdown 源码</summary>
                      <pre className="mt-1 max-h-40 overflow-auto rounded border border-dashed border-gray-200 bg-gray-50 p-2 font-mono text-[10px] leading-relaxed text-gray-700">
                        {afterMarkdown}
                      </pre>
                    </details>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/80 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!canApply}
            onClick={onApply}
            className={cn(
              'rounded-md px-4 py-2 text-[12px] font-semibold text-white shadow-sm',
              canApply
                ? 'bg-violet-600 hover:bg-violet-700'
                : 'cursor-not-allowed bg-gray-300 text-gray-500',
            )}
          >
            应用润色结果
          </button>
        </footer>
      </div>
    </div>
  )
}
