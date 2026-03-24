import { CalendarDays, ChevronRight, Paperclip } from 'lucide-react'
import {
  EXPERIENCE_CATEGORY_LABELS,
  normalizeExperienceCategory,
} from '../../services/db'
import { TagChips } from './TagChips'

/**
 * @param {{ experience: import('../../services/db.js').Experience; onOpen: (e: import('../../services/db.js').Experience) => void }} props
 */
export function ExperienceCard({ experience, onOpen }) {
  const { company, role, type, tags, startDate, endDate, attachments } =
    experience
  const cat = normalizeExperienceCategory(experience.category)
  const catLabel = EXPERIENCE_CATEGORY_LABELS[cat]
  const span =
    startDate || endDate
      ? `${startDate || '—'} ～ ${endDate?.trim() ? endDate : '至今'}`
      : '时间未填'

  const attachCount = Array.isArray(attachments) ? attachments.length : 0

  return (
    <button
      type="button"
      onClick={() => onOpen(experience)}
      className="group flex w-full flex-col rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:border-slate-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="mb-1 mr-1.5 inline-block rounded border border-slate-100 bg-slate-50/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {catLabel}
          </span>
          {type ? (
            <span className="mb-1 inline-block rounded bg-slate-100/90 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600">
              {type}
            </span>
          ) : null}
          <h2 className="truncate text-base font-semibold tracking-tight text-slate-800">
            {company || '未命名组织'}
          </h2>
          <p className="mt-0.5 truncate text-sm leading-relaxed text-slate-600">{role || '—'}</p>
        </div>
        <ChevronRight
          className="size-5 shrink-0 text-slate-300 transition group-hover:text-indigo-400/75"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3.5 text-slate-400" strokeWidth={1.5} aria-hidden />
          {span}
        </span>
        {attachCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Paperclip className="size-3.5 text-slate-400" strokeWidth={1.5} aria-hidden />
            {attachCount} 个附件
          </span>
        ) : null}
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <TagChips tags={tags} />
      </div>
    </button>
  )
}
