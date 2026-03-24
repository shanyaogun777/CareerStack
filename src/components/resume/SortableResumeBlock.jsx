import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Sparkles, Trash2 } from 'lucide-react'
import { MarkdownPreview } from '../experiences/MarkdownPreview'
import { cn } from '../../lib/cn'
import { EditablePlain } from './EditablePlain'

/**
 * @param {{
 *   block: import('../../services/db.js').ResumeExperienceBlock
 *   sortableId: string
 *   section: 'education' | 'work' | 'projects' | 'campus'
 *   onPatch: (patch: Partial<import('../../services/db.js').ResumeExperienceBlock>) => void
 *   onRemove: () => void
 *   onRequestPolish?: () => void
 *   polishDisabled?: boolean
 *   polishTitle?: string
 * }} props
 */
export function SortableResumeBlock({
  block,
  sortableId,
  section,
  onPatch,
  onRemove,
  onRequestPolish,
  polishDisabled,
  polishTitle,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    data: { kind: 'block', section },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dateLine = `${block.startDate || '—'} ～ ${block.endDate?.trim() ? block.endDate : '至今'}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border border-slate-200/90 bg-white px-3.5 py-3 shadow-sm',
        isDragging && 'z-10 opacity-80 shadow-lg ring-1 ring-slate-100',
      )}
    >
      <div className="resume-ui-only mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-lg border border-slate-200/90 bg-slate-50/80 text-slate-400 transition-colors hover:bg-slate-50"
          aria-label="拖拽排序"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-[18px]" strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-1">
          {onRequestPolish ? (
            <button
              type="button"
              onClick={onRequestPolish}
              disabled={polishDisabled}
              title={polishTitle ?? 'AI 润色'}
              className="flex size-7 items-center justify-center rounded-lg border border-indigo-100/90 bg-indigo-50/50 text-indigo-400/85 transition-colors hover:bg-indigo-50/80 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300"
              aria-label="AI 润色"
            >
              <Sparkles className="size-[14px]" strokeWidth={1.5} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRemove}
            className="flex size-7 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-red-100/90 hover:bg-red-50/80 hover:text-red-500/90"
            aria-label="移除此条"
          >
            <Trash2 className="size-[18px]" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <EditablePlain
          as="div"
          value={block.company}
          onCommit={(v) => onPatch({ company: v })}
          className="min-w-[4rem] max-w-full text-[13px] font-semibold leading-snug text-slate-800"
        />
        <span className="text-[12px] text-slate-300" aria-hidden>
          ·
        </span>
        <EditablePlain
          as="div"
          value={block.role}
          onCommit={(v) => onPatch({ role: v })}
          className="min-w-[3rem] max-w-full text-[12px] font-medium text-slate-600"
        />
      </div>
      <div className="mt-1">
        <EditablePlain
          as="div"
          value={dateLine}
          onCommit={(v) => {
            const parts = v.split(/[～~]/).map((s) => s.trim())
            onPatch({
              startDate: parts[0] && parts[0] !== '—' ? parts[0] : '',
              endDate: parts[1] && parts[1] !== '至今' ? parts[1] : '',
            })
          }}
          className="text-[10.5px] leading-snug text-slate-500"
        />
      </div>
      {block.type ? (
        <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {block.type}
        </div>
      ) : null}

      <div className="resume-ui-only mt-2">
        <label className="mb-0.5 block text-[10px] font-medium text-slate-500">
          Markdown 源码
        </label>
        <textarea
          value={block.description}
          onChange={(e) => onPatch({ description: e.target.value })}
          spellCheck={false}
          className="min-h-[80px] w-full resize-y rounded-lg border border-dashed border-slate-200/90 bg-slate-50/70 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-100"
        />
      </div>

      <div className="resume-md-surface mt-2 border-t border-slate-100 pt-2">
        <div className="mb-1 text-[10px] font-medium text-slate-400">预览</div>
        <MarkdownPreview
          markdown={block.description}
          compact
          emptyHint="（无描述）"
          className="[&_.prose]:leading-snug"
        />
      </div>
    </div>
  )
}
