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
    'w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[11px] text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200'

  return (
    <section
      className={cn(
        'mb-9',
        !hasPublic && 'resume-custom-empty-export',
      )}
    >
      <div className="resume-ui-only mb-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
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
            className="inline-flex items-center gap-1 rounded-md border border-red-100 bg-white px-2.5 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
            删除模块
          </button>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-medium text-gray-500">
            Markdown 源码
          </label>
          <textarea
            value={module.body}
            onChange={(e) => onPatch({ body: e.target.value })}
            spellCheck={false}
            className="min-h-[100px] w-full resize-y rounded border border-dashed border-gray-200 bg-white px-2 py-1.5 font-mono text-[11px] leading-relaxed text-gray-800 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-200"
            placeholder="支持 **加粗**、列表与嵌套，与经历模块一致。"
          />
        </div>
      </div>

      {filled(module.title) ? (
        <h2 className="mb-2 border-b border-gray-900/90 pb-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-gray-900">
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
