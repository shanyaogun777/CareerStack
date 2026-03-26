import { forwardRef } from 'react'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { MarkdownPreview } from '../experiences/MarkdownPreview'
import { cn } from '../../lib/cn'
import { SortableResumeBlock } from './SortableResumeBlock'
import { ResumeBasicsSection } from './ResumeBasicsSection'
import { ResumeCustomModuleBlock } from './ResumeCustomModuleBlock'

/**
 * @typedef {'education' | 'work' | 'projects' | 'campus'} DroppableResumeSection
 */

/**
 * @param {{ id: string; section: DroppableResumeSection; children: import('react').ReactNode; className?: string }} props
 */
function DropStack({ id, section, children, className }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { kind: 'zone', section },
  })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'resume-a4-dropzone min-h-[52px] rounded-lg border border-dashed border-slate-200/90 bg-slate-50/30 p-2.5 transition-colors',
        isOver && 'border-slate-400/70 bg-amber-50/35',
        className,
      )}
    >
      {children}
    </div>
  )
}

const ADDABLE_STANDARD = [
  { key: 'education', label: '教育背景' },
  { key: 'work', label: '工作 / 实习' },
  { key: 'projects', label: '项目经历' },
  { key: 'campus', label: '校园经历' },
  { key: 'selfEval', label: '自我评价' },
]

/**
 * @param {{
 *   title: string
 *   onRemove: () => void
 *   className?: string
 * }} props
 */
function SectionHeaderRemovable({ title, onRemove, className }) {
  return (
    <div
      className={cn(
        'mb-3 flex items-center justify-between gap-2 border-b border-slate-800/35 pb-1.5',
        className,
      )}
    >
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-800">
        {title}
      </h2>
      <button
        type="button"
        onClick={onRemove}
        className="resume-ui-only flex size-7 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-red-100/90 hover:bg-red-50/80 hover:text-red-500/90"
        aria-label={`移除${title}模块`}
        title="从画布移除该模块（内容仍保留，可通过「添加标准模块」恢复）"
      >
        <Trash2 className="size-[14px]" strokeWidth={1.5} />
      </button>
    </div>
  )
}

/**
 * @param {{
 *   sortableId: string
 *   title: string
 *   children: import('react').ReactNode
 * }} props
 */
function SortableLayoutSection({ sortableId, title, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: sortableId,
      data: { kind: 'layout' },
    })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl',
        isDragging && 'opacity-80 ring-1 ring-slate-200/90 shadow-sm',
      )}
    >
      <div className="resume-ui-only mb-2 flex items-center justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm"
          aria-label={`拖拽调整「${title}」模块顺序`}
          title={`拖拽调整「${title}」模块顺序`}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-[13px] text-slate-400" strokeWidth={1.5} />
          排序
        </button>
      </div>
      {children}
    </div>
  )
}

/**
 * @param {{
 *   sections: import('../../services/db.js').ResumeSections
 *   layout: import('../../services/db.js').ResumeLayoutItem[]
 *   patchBasics: (p: Partial<import('../../services/db.js').ResumeBasics>) => void
 *   patchSelfEval: (body: string) => void
 *   addCustomModule: () => void
 *   patchCustomModule: (
 *     id: string,
 *     p: Partial<import('../../services/db.js').ResumeCustomModule>,
 *   ) => void
 *   removeCustomModule: (id: string) => void
 *   addStandardLayoutModule: (key: string) => void
 *   removeStandardLayoutModule: (key: string) => void
 *   patchExperienceBlock: (
 *     section: DroppableResumeSection,
 *     id: string,
 *     p: Partial<import('../../services/db.js').ResumeExperienceBlock>,
 *   ) => void
 *   removeExperienceBlock: (section: DroppableResumeSection, id: string) => void
 *   onRequestPolish?: (section: DroppableResumeSection, blockId: string) => void
 *   polishDisabled?: boolean
 *   polishTooltip?: string
 * }} props
 */
export const ResumeA4Canvas = forwardRef(function ResumeA4Canvas(
  {
    sections,
    layout,
    patchBasics,
    patchSelfEval,
    addCustomModule,
    patchCustomModule,
    removeCustomModule,
    addStandardLayoutModule,
    removeStandardLayoutModule,
    patchExperienceBlock,
    removeExperienceBlock,
    onRequestPolish,
    polishDisabled,
    polishTooltip,
  },
  ref,
) {
  const eduIds = sections.education.map((b) => `edu:${b.id}`)
  const workIds = sections.work.map((b) => `work:${b.id}`)
  const projectIds = sections.projects.map((b) => `proj:${b.id}`)
  const campusIds = sections.campus.map((b) => `camp:${b.id}`)

  const sectionTitle = {
    basics: '基本信息',
    education: '教育背景',
    work: '工作 / 实习经历',
    projects: '项目经历',
    campus: '校园经历',
    selfEval: '自我评价',
  }

  /**
   * @param {import('../../services/db.js').ResumeLayoutItem} key
   */
  function renderSection(key) {
    if (typeof key === 'string' && key.startsWith('custom:')) {
      const cid = key.slice('custom:'.length)
      const mod = sections.customModules?.find((m) => m.id === cid)
      if (!mod) return null
      return (
        <ResumeCustomModuleBlock
          key={key}
          module={mod}
          onPatch={(p) => patchCustomModule(cid, p)}
          onRemove={() => removeCustomModule(cid)}
        />
      )
    }

    switch (key) {
      case 'basics':
        return (
          <ResumeBasicsSection
            key={key}
            basics={sections.basics}
            patchBasics={patchBasics}
          />
        )
      case 'education':
        return (
          <section key={key} className="mb-9">
            <SectionHeaderRemovable
              title={sectionTitle.education}
              onRemove={() => removeStandardLayoutModule('education')}
            />
            <DropStack id="zone-education" section="education">
              <SortableContext items={eduIds} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col gap-3">
                  {sections.education.map((b) => (
                    <li key={b.id}>
                      <SortableResumeBlock
                        block={b}
                        sortableId={`edu:${b.id}`}
                        section="education"
                        onPatch={(p) =>
                          patchExperienceBlock('education', b.id, p)
                        }
                        onRemove={() =>
                          removeExperienceBlock('education', b.id)
                        }
                        onRequestPolish={
                          onRequestPolish
                            ? () => onRequestPolish('education', b.id)
                            : undefined
                        }
                        polishDisabled={polishDisabled}
                        polishTitle={polishTooltip}
                      />
                    </li>
                  ))}
                </ul>
              </SortableContext>
              {sections.education.length === 0 ? (
                <p className="resume-ui-only px-1 py-3 text-center text-[11px] text-slate-400">
                  从左侧「教育背景」分类拖入素材；简历内修改不影响个人信息库。
                </p>
              ) : null}
            </DropStack>
          </section>
        )
      case 'work':
        return (
          <section key={key} className="mb-9">
            <SectionHeaderRemovable
              title={sectionTitle.work}
              onRemove={() => removeStandardLayoutModule('work')}
            />
            <DropStack id="zone-work" section="work">
              <SortableContext items={workIds} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col gap-3">
                  {sections.work.map((b) => (
                    <li key={b.id}>
                      <SortableResumeBlock
                        block={b}
                        sortableId={`work:${b.id}`}
                        section="work"
                        onPatch={(p) => patchExperienceBlock('work', b.id, p)}
                        onRemove={() => removeExperienceBlock('work', b.id)}
                        onRequestPolish={
                          onRequestPolish
                            ? () => onRequestPolish('work', b.id)
                            : undefined
                        }
                        polishDisabled={polishDisabled}
                        polishTitle={polishTooltip}
                      />
                    </li>
                  ))}
                </ul>
              </SortableContext>
              {sections.work.length === 0 ? (
                <p className="resume-ui-only px-1 py-3 text-center text-[11px] text-slate-400">
                  从左侧「工作/实习经历」分类拖入素材。
                </p>
              ) : null}
            </DropStack>
          </section>
        )
      case 'projects':
        return (
          <section key={key} className="mb-9">
            <SectionHeaderRemovable
              title={sectionTitle.projects}
              onRemove={() => removeStandardLayoutModule('projects')}
            />
            <DropStack id="zone-projects" section="projects">
              <SortableContext
                items={projectIds}
                strategy={verticalListSortingStrategy}
              >
                <ul className="flex flex-col gap-3">
                  {sections.projects.map((b) => (
                    <li key={b.id}>
                      <SortableResumeBlock
                        block={b}
                        sortableId={`proj:${b.id}`}
                        section="projects"
                        onPatch={(p) =>
                          patchExperienceBlock('projects', b.id, p)
                        }
                        onRemove={() =>
                          removeExperienceBlock('projects', b.id)
                        }
                        onRequestPolish={
                          onRequestPolish
                            ? () => onRequestPolish('projects', b.id)
                            : undefined
                        }
                        polishDisabled={polishDisabled}
                        polishTitle={polishTooltip}
                      />
                    </li>
                  ))}
                </ul>
              </SortableContext>
              {sections.projects.length === 0 ? (
                <p className="resume-ui-only px-1 py-3 text-center text-[11px] text-slate-400">
                  从左侧「项目经历」分类拖入素材。
                </p>
              ) : null}
            </DropStack>
          </section>
        )
      case 'campus':
        return (
          <section key={key} className="mb-9">
            <SectionHeaderRemovable
              title={sectionTitle.campus}
              onRemove={() => removeStandardLayoutModule('campus')}
            />
            <DropStack id="zone-campus" section="campus">
              <SortableContext
                items={campusIds}
                strategy={verticalListSortingStrategy}
              >
                <ul className="flex flex-col gap-3">
                  {sections.campus.map((b) => (
                    <li key={b.id}>
                      <SortableResumeBlock
                        block={b}
                        sortableId={`camp:${b.id}`}
                        section="campus"
                        onPatch={(p) =>
                          patchExperienceBlock('campus', b.id, p)
                        }
                        onRemove={() =>
                          removeExperienceBlock('campus', b.id)
                        }
                        onRequestPolish={
                          onRequestPolish
                            ? () => onRequestPolish('campus', b.id)
                            : undefined
                        }
                        polishDisabled={polishDisabled}
                        polishTitle={polishTooltip}
                      />
                    </li>
                  ))}
                </ul>
              </SortableContext>
              {sections.campus.length === 0 ? (
                <p className="resume-ui-only px-1 py-3 text-center text-[11px] text-slate-400">
                  从左侧「校园经历」分类拖入素材。
                </p>
              ) : null}
            </DropStack>
          </section>
        )
      case 'selfEval': {
        const evalEmpty = !String(sections.selfEval.body ?? '').trim()
        return (
          <section
            key={key}
            className={cn('mb-2', evalEmpty && 'resume-eval-empty-export')}
          >
            <SectionHeaderRemovable
              title={sectionTitle.selfEval}
              onRemove={() => removeStandardLayoutModule('selfEval')}
            />
            <div className="resume-ui-only mb-2">
              <label className="mb-0.5 block text-[10px] font-medium text-slate-500">
                Markdown 源码
              </label>
              <textarea
                value={sections.selfEval.body}
                onChange={(e) => patchSelfEval(e.target.value)}
                spellCheck={false}
                className="min-h-[88px] w-full resize-y rounded-lg border border-dashed border-slate-200/90 bg-slate-50/70 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-100"
              />
            </div>
            {!evalEmpty ? (
              <div className="resume-md-surface">
                <MarkdownPreview
                  markdown={sections.selfEval.body}
                  compact
                  emptyHint="（可在此总结优势与求职动机）"
                />
              </div>
            ) : null}
          </section>
        )
      }
      default:
        return null
    }
  }

  const layoutSortableIds = layout.map((k) => `layout:${k}`)

  return (
    <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-slate-100/80 px-4 py-6 md:px-8">
      <div
        ref={ref}
        className="resume-a4-root h-fit w-[794px] min-h-[1123px] shrink-0 bg-white px-[48px] pb-[52px] pt-[44px] shadow-[0_10px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-100"
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        }}
      >
        <div className="resume-ui-only mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-3">
          <span className="text-[10px] font-semibold text-slate-600">
            添加标准模块
          </span>
          {ADDABLE_STANDARD.map(({ key, label }) =>
            layout.includes(key) ? null : (
              <button
                key={key}
                type="button"
                onClick={() => addStandardLayoutModule(key)}
                className="rounded-lg border border-slate-200/90 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50/90"
              >
                + {label}
              </button>
            ),
          )}
        </div>

        <SortableContext items={layoutSortableIds} strategy={verticalListSortingStrategy}>
          {layout.map((k) => (
            <SortableLayoutSection
              key={k}
              sortableId={`layout:${k}`}
              title={
                typeof k === 'string' && k.startsWith('custom:')
                  ? '自定义模块'
                  : sectionTitle[k] || '模块'
              }
            >
              {renderSection(k)}
            </SortableLayoutSection>
          ))}
        </SortableContext>

        <div className="resume-ui-only flex justify-center pb-2 pt-2">
          <button
            type="button"
            onClick={addCustomModule}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-[11px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50/90"
          >
            <Plus className="size-[14px] text-slate-400" strokeWidth={1.5} aria-hidden />
            添加自定义模块
          </button>
        </div>
      </div>
    </div>
  )
})

ResumeA4Canvas.displayName = 'ResumeA4Canvas'
