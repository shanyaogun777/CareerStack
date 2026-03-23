import { useDraggable } from '@dnd-kit/core'
import { GripVertical, Layers } from 'lucide-react'
import {
  EXPERIENCE_CATEGORIES,
  EXPERIENCE_CATEGORY_LABELS,
  normalizeExperienceCategory,
} from '../../services/db'
import { cn } from '../../lib/cn'
import { TagChips } from '../experiences/TagChips'
import { EmptyState } from '../ui/EmptyState'

/**
 * @param {{ experience: import('../../services/db.js').Experience }} props
 */
function MaterialRow({ experience }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${experience.id}`,
    data: { kind: 'palette', experienceId: experience.id },
  })

  const span =
    experience.startDate || experience.endDate
      ? `${experience.startDate || '—'} ～ ${experience.endDate?.trim() ? experience.endDate : '至今'}`
      : ''

  const cat = normalizeExperienceCategory(experience.category)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex gap-2 rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm',
        isDragging && 'opacity-40',
      )}
    >
      <button
        type="button"
        className="resume-ui-only mt-0.5 flex size-7 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
        aria-label="拖拽手柄"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="size-4" strokeWidth={1.75} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[9px] font-medium uppercase tracking-wide text-gray-400">
          {EXPERIENCE_CATEGORY_LABELS[cat]}
        </div>
        <div className="truncate text-[12px] font-semibold text-gray-900">
          {experience.company || '未命名组织'}
        </div>
        <div className="truncate text-[11px] text-gray-600">
          {experience.role || '—'}
        </div>
        {span ? (
          <div className="mt-1 text-[10px] text-gray-400">{span}</div>
        ) : null}
        <div className="mt-1.5">
          <TagChips tags={experience.tags || []} />
        </div>
      </div>
    </div>
  )
}

/**
 * @param {{ experiences: import('../../services/db.js').Experience[] }} props
 */
export function MaterialDrawer({ experiences }) {
  return (
    <aside className="flex h-full min-h-0 w-[280px] shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-[13px] font-semibold text-gray-900">素材抽屉</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
          按分类拖入右侧对应板块；仅同类素材可落入对应区域。简历内修改为副本，不修改个人信息库原件。
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {experiences.length === 0 ? (
          <EmptyState
            className="border-0 bg-transparent py-8"
            icon={<Layers className="size-7" strokeWidth={1.5} aria-hidden />}
            title="素材库还是空的"
            description="请先到「个人信息库」录入教育、实习与项目经历，再回到此处拖拽到简历画布。"
          />
        ) : (
          <div className="flex flex-col gap-5">
            {EXPERIENCE_CATEGORIES.map((cat) => {
              const list = experiences.filter(
                (e) => normalizeExperienceCategory(e.category) === cat,
              )
              return (
                <section key={cat}>
                  <h3 className="mb-2 border-b border-gray-100 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                    {EXPERIENCE_CATEGORY_LABELS[cat]}
                  </h3>
                  {list.length === 0 ? (
                    <p className="text-[10px] text-gray-400">暂无条目</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {list.map((exp) => (
                        <li key={exp.id}>
                          <MaterialRow experience={exp} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
