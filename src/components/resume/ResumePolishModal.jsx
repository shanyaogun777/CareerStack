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
      <div className="flex max-h-[min(92vh,880px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 id="resume-polish-title" className="text-sm font-semibold tracking-tight text-slate-800">
            AI 润色 · 修改前后对比
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            aria-label="关闭"
          >
            <X className="size-[18px]" strokeWidth={1.5} />
          </button>
        </header>

        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-sm leading-relaxed text-slate-600">
            <Loader2 className="size-8 animate-spin text-indigo-400/75" strokeWidth={1.5} aria-hidden />
            <p>正在结合目标岗位 JD 按 STAR 润色，请稍候…</p>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="flex min-h-[200px] flex-col overflow-hidden md:min-h-[320px]">
              <div className="shrink-0 border-b border-slate-100 bg-slate-50/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                修改前
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-3.5">
                <div className="resume-md-surface rounded-lg border border-slate-100 bg-white p-2.5">
                  <MarkdownPreview
                    markdown={beforeMarkdown}
                    compact
                    emptyHint="（空）"
                    className="[&_.prose]:text-[11px] [&_.prose]:leading-relaxed"
                  />
                </div>
                <details className="mt-2 resume-ui-only">
                  <summary className="cursor-pointer text-[10px] text-slate-500">查看 Markdown 源码</summary>
                  <pre className="mt-1 max-h-40 overflow-auto rounded-lg border border-dashed border-slate-200/90 bg-slate-50/80 p-2 font-mono text-[10px] leading-relaxed text-slate-600">
                    {beforeMarkdown}
                  </pre>
                </details>
              </div>
            </div>
            <div className="flex min-h-[200px] flex-col overflow-hidden md:min-h-[320px]">
              <div className="shrink-0 border-b border-slate-100 bg-indigo-50/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-indigo-900/70">
                修改后
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-3.5">
                {error ? (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                ) : (
                  <>
                    <div className="resume-md-surface rounded-lg border border-indigo-100/80 bg-white p-2.5">
                      <MarkdownPreview
                        markdown={afterMarkdown}
                        compact
                        emptyHint="（无输出）"
                        className="[&_.prose]:text-[11px] [&_.prose]:leading-relaxed"
                      />
                    </div>
                    <details className="mt-2 resume-ui-only">
                      <summary className="cursor-pointer text-[10px] text-slate-500">查看 Markdown 源码</summary>
                      <pre className="mt-1 max-h-40 overflow-auto rounded-lg border border-dashed border-slate-200/90 bg-slate-50/80 p-2 font-mono text-[10px] leading-relaxed text-slate-600">
                        {afterMarkdown}
                      </pre>
                    </details>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-[12px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50/90"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!canApply}
            onClick={onApply}
            className={cn(
              'rounded-lg px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-colors',
              canApply
                ? 'bg-indigo-500/90 hover:bg-indigo-500'
                : 'cursor-not-allowed bg-slate-200 text-slate-500',
            )}
          >
            应用润色结果
          </button>
        </footer>
      </div>
    </div>
  )
}
