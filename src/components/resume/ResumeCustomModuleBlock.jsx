import { Trash2 } from 'lucide-react'
import { MarkdownPreview } from '../experiences/MarkdownPreview'
import { cn } from '../../lib/cn'

function filled(v) {
  return String(v ?? '').trim().length > 0
}

/**
 * @param {{
 *   module: import('../../services/db.js').ResumeCustomModule
 *   onPatch: (p: Partial<import('../../services/db.js').ResumeCustomModule>) => void
 *   onRemove: () => void
 * }} props
 */
export function ResumeCustomModuleBlock({ module, onPatch, onRemove }) {
  const hasPublic = filled(module.title) || filled(module.body)

  const inputCls =
    'w-full rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-[11px] text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-100'

  return (
    <section
      className={cn(
        'mb-9',
        !hasPublic && 'resume-custom-empty-export',
      )}
    >
      <div className="resume-ui-only mb-3 space-y-2 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="sr-only" htmlFor={`custom-title-${module.id}`}>
            模块标题
          </label>
          <input
            id={`custom-title-${module.id}`}
            className={cn(inputCls, 'max-w-md flex-1')}
            placeholder="模块标题，如：学术论文"
            value={module.title}
            onChange={(e) => onPatch({ title: e.target.value })}
          />
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-lg border border-red-100/90 bg-white px-2.5 py-1.5 text-[10px] font-medium text-red-500/90 transition-colors hover:bg-red-50/80"
          >
            <Trash2 className="size-[14px] text-slate-400" strokeWidth={1.5} aria-hidden />
            删除模块
          </button>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-medium text-slate-500">
            Markdown 源码
          </label>
          <textarea
            value={module.body}
            onChange={(e) => onPatch({ body: e.target.value })}
            spellCheck={false}
            className="min-h-[100px] w-full resize-y rounded-lg border border-dashed border-slate-200/90 bg-white px-2 py-1.5 font-mono text-[11px] leading-relaxed text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-100"
            placeholder="支持 **加粗**、列表与嵌套，与经历模块一致。"
          />
        </div>
      </div>

      {filled(module.title) ? (
        <h2 className="mb-2 border-b border-slate-800/35 pb-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-800">
          {module.title.trim()}
        </h2>
      ) : null}

      {filled(module.body) ? (
        <div className="resume-md-surface">
          <MarkdownPreview
            markdown={module.body}
            compact
            emptyHint=""
            className="[&_.prose]:leading-snug"
          />
        </div>
      ) : null}
    </section>
  )
}
