import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Copy, Download, FilePlus, Loader2, Trash2 } from 'lucide-react'
import {
  createDefaultResumeLayout,
  createDefaultResumeSections,
  experienceRepository,
  jobRepository,
  mergeResumeSections,
  normalizeExperienceCategory,
  resumeRepository,
} from '../services/db'
import { hasAiApiKey, polishResumeExperienceMarkdown } from '../services/ai'
import { createResumeBlockFromExperience } from '../utils/resumeClone'
import { exportResumeToPdf } from '../utils/exportHelper'
import { cn } from '../lib/cn'
import { MaterialDrawer } from '../components/resume/MaterialDrawer'
import { ResumeA4Canvas } from '../components/resume/ResumeA4Canvas'
import { ResumePolishModal } from '../components/resume/ResumePolishModal'

/** @typedef {'education'|'work'|'projects'|'campus'} ResumeBlockSectionKey */

/**
 * @param {import('@dnd-kit/core').UniqueIdentifier} id
 */
function parseBlockPointer(id) {
  const s = String(id)
  if (s.startsWith('edu:')) return { key: 'education', blockId: s.slice(4) }
  if (s.startsWith('work:')) return { key: 'work', blockId: s.slice(5) }
  if (s.startsWith('proj:')) return { key: 'projects', blockId: s.slice(5) }
  if (s.startsWith('camp:')) return { key: 'campus', blockId: s.slice(5) }
  return null
}

/**
 * @param {string} overId
 * @returns {ResumeBlockSectionKey | null}
 */
function zoneFromOverId(overId) {
  if (overId === 'zone-education' || overId.startsWith('edu:')) return 'education'
  if (overId === 'zone-work' || overId.startsWith('work:')) return 'work'
  if (overId === 'zone-projects' || overId.startsWith('proj:')) return 'projects'
  if (overId === 'zone-campus' || overId.startsWith('camp:')) return 'campus'
  return null
}

/**
 * @param {import('../services/db.js').Experience} exp
 * @param {ResumeBlockSectionKey} zone
 */
function categoryMatchesZone(exp, zone) {
  const c = normalizeExperienceCategory(exp.category)
  if (c === 'education') return zone === 'education'
  if (c === 'work') return zone === 'work'
  if (c === 'project') return zone === 'projects'
  if (c === 'campus') return zone === 'campus'
  return false
}

const LAYOUT_MODULE_ORDER = [
  'basics',
  'education',
  'work',
  'projects',
  'campus',
  'selfEval',
]

const LS_POLISH_JOB = 'careerstack_resume_polish_job_id'

/**
 * @param {import('../services/db.js').StructuredJD | null | undefined} jd
 */
function hasStructuredJDContent(jd) {
  if (!jd || typeof jd !== 'object') return false
  return String(Object.values(jd).join('')).trim().length > 0
}

export function ResumeEditor() {
  /** 白底 A4 根节点（794px）：PDF 截图目标；见 `index.css` 的 `@theme` 与 `.resume-export-mode` */
  const a4Ref = useRef(/** @type {HTMLDivElement | null} */ (null))
  const [bootError, setBootError] = useState('')
  const [resumes, setResumes] = useState(
    /** @type {import('../services/db.js').Resume[]} */ ([]),
  )
  const [resumeId, setResumeId] = useState(/** @type {number | null} */ (null))
  const [title, setTitle] = useState('我的简历')
  const [layout, setLayout] = useState(createDefaultResumeLayout)
  const [sections, setSections] = useState(() => mergeResumeSections({}))
  const [experiences, setExperiences] = useState([])
  const [jobs, setJobs] = useState(
    /** @type {import('../services/db.js').Job[]} */ ([]),
  )
  const [polishJobId, setPolishJobId] = useState(/** @type {number | null} */ (null))
  const [polishModal, setPolishModal] = useState(
    /** @type {{
     *   section: ResumeBlockSectionKey
     *   blockId: string
     *   before: string
     *   after: string
     *   loading: boolean
     *   error: string
     * } | null} */ (null),
  )
  const [overlay, setOverlay] = useState(
    /** @type {{ type: 'palette'; exp: import('../services/db.js').Experience } | { type: 'block'; block: import('../services/db.js').ResumeExperienceBlock } | null} */ (
      null
    ),
  )
  const [exporting, setExporting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let list = await resumeRepository.getAll()
        if (cancelled) return
        if (list.length === 0) {
          await resumeRepository.create({
            title: '我的简历',
            layout: createDefaultResumeLayout(),
            sections: createDefaultResumeSections(),
          })
          list = await resumeRepository.getAll()
        }
        if (cancelled) return
        const [exps, jList] = await Promise.all([
          experienceRepository.getAll(),
          jobRepository.getAll(),
        ])
        if (cancelled) return
        const first = list[0]
        setResumes(list)
        setResumeId(first.id)
        setTitle(first.title)
        setLayout(
          first.layout?.length ? first.layout : createDefaultResumeLayout(),
        )
        setSections(mergeResumeSections(first.sections))
        setExperiences(exps)
        setJobs(jList)
        const savedPid = localStorage.getItem(LS_POLISH_JOB)
        const pidNum = savedPid ? Number(savedPid) : NaN
        if (jList.some((j) => j.id === pidNum)) {
          setPolishJobId(pidNum)
        } else {
          setPolishJobId(null)
        }
        setBootError('')
      } catch (e) {
        if (!cancelled) {
          setBootError(e instanceof Error ? e.message : '初始化失败')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (resumeId == null) return
    const t = setTimeout(() => {
      void resumeRepository.update(resumeId, {
        title,
        layout,
        sections,
      })
    }, 480)
    return () => clearTimeout(t)
  }, [resumeId, title, layout, sections])

  const patchBasics = useCallback((p) => {
    setSections((prev) => {
      const nextBasics = { ...prev.basics, ...p }
      if (
        Object.prototype.hasOwnProperty.call(p, 'avatarBlob') &&
        p.avatarBlob === undefined
      ) {
        delete nextBasics.avatarBlob
        delete nextBasics.avatarMimeType
      }
      return { ...prev, basics: nextBasics }
    })
  }, [])

  const flushSave = useCallback(async () => {
    if (resumeId == null) return
    await resumeRepository.update(resumeId, { title, layout, sections })
  }, [resumeId, title, layout, sections])

  const applyResumeRow = useCallback((row) => {
    setTitle(row.title)
    setLayout(row.layout?.length ? row.layout : createDefaultResumeLayout())
    setSections(mergeResumeSections(row.sections))
  }, [])

  const refreshResumeList = useCallback(async () => {
    const list = await resumeRepository.getAll()
    setResumes(list)
    return list
  }, [])

  const handlePickResume = useCallback(
    async (nextId) => {
      if (nextId === resumeId) return
      await flushSave()
      const row = await resumeRepository.getById(nextId)
      if (!row) return
      setResumeId(nextId)
      applyResumeRow(row)
      await refreshResumeList()
    },
    [applyResumeRow, flushSave, refreshResumeList, resumeId],
  )

  const handleNewResume = useCallback(async () => {
    await flushSave()
    const newId = await resumeRepository.create({
      title: '新简历',
      layout: createDefaultResumeLayout(),
      sections: createDefaultResumeSections(),
    })
    const list = await refreshResumeList()
    const row = list.find((r) => r.id === newId) ?? (await resumeRepository.getById(newId))
    if (!row) return
    setResumeId(row.id)
    applyResumeRow(row)
  }, [applyResumeRow, flushSave, refreshResumeList])

  const handleDuplicateResume = useCallback(async () => {
    if (resumeId == null) return
    await flushSave()
    const row = await resumeRepository.getById(resumeId)
    if (!row) return
    const sectionsClone = mergeResumeSections(structuredClone(row.sections))
    const newId = await resumeRepository.create({
      title: `${row.title}-副本`,
      layout: [...row.layout],
      sections: sectionsClone,
    })
    const list = await refreshResumeList()
    const created = list.find((r) => r.id === newId) ?? (await resumeRepository.getById(newId))
    if (!created) return
    setResumeId(created.id)
    applyResumeRow(created)
  }, [applyResumeRow, flushSave, refreshResumeList, resumeId])

  const handleDeleteResume = useCallback(async () => {
    if (resumeId == null) return
    if (resumes.length <= 1) {
      window.alert('至少需要保留一份简历。')
      return
    }
    if (!window.confirm('确定删除当前简历？此操作不可恢复。')) return
    await resumeRepository.remove(resumeId)
    const list = await refreshResumeList()
    const next = list[0]
    if (!next) return
    setResumeId(next.id)
    applyResumeRow(next)
  }, [applyResumeRow, refreshResumeList, resumeId, resumes.length])

  const addCustomModule = useCallback(() => {
    const id = crypto.randomUUID()
    setLayout((prev) => [...prev, `custom:${id}`])
    setSections((prev) => ({
      ...prev,
      customModules: [...(prev.customModules || []), { id, title: '', body: '' }],
    }))
  }, [])

  const patchCustomModule = useCallback((id, p) => {
    setSections((prev) => ({
      ...prev,
      customModules: (prev.customModules || []).map((m) =>
        m.id === id ? { ...m, ...p } : m,
      ),
    }))
  }, [])

  const removeCustomModule = useCallback((id) => {
    setLayout((prev) => prev.filter((k) => k !== `custom:${id}`))
    setSections((prev) => ({
      ...prev,
      customModules: (prev.customModules || []).filter((m) => m.id !== id),
    }))
  }, [])

  const removeStandardLayoutModule = useCallback((moduleKey) => {
    setLayout((prev) => prev.filter((k) => k !== moduleKey))
  }, [])

  const addStandardLayoutModule = useCallback((moduleKey) => {
    setLayout((prev) => {
      if (prev.includes(moduleKey)) return prev
      const orderIdx = LAYOUT_MODULE_ORDER.indexOf(moduleKey)
      if (orderIdx < 0) return [...prev, moduleKey]
      let insertAt = prev.length
      for (let i = 0; i < prev.length; i++) {
        const cur = LAYOUT_MODULE_ORDER.indexOf(prev[i])
        if (cur >= 0 && cur > orderIdx) {
          insertAt = i
          break
        }
      }
      const next = [...prev]
      next.splice(insertAt, 0, moduleKey)
      return next
    })
  }, [])

  const patchSelfEval = useCallback((body) => {
    setSections((prev) => ({
      ...prev,
      selfEval: { ...prev.selfEval, body },
    }))
  }, [])

  const patchExperienceBlock = useCallback(
    /**
     * @param {ResumeBlockSectionKey} section
     */
    (section, id, p) => {
      setSections((prev) => ({
        ...prev,
        [section]: prev[section].map((b) =>
          b.id === id ? { ...b, ...p } : b,
        ),
      }))
    },
    [],
  )

  const removeExperienceBlock = useCallback(
    /**
     * @param {ResumeBlockSectionKey} section
     */
    (section, id) => {
      setSections((prev) => ({
        ...prev,
        [section]: prev[section].filter((b) => b.id !== id),
      }))
    },
    [],
  )

  const polishLinkedJob = useMemo(() => {
    if (polishJobId == null) return null
    return jobs.find((j) => j.id === polishJobId) ?? null
  }, [polishJobId, jobs])

  const polishReady = Boolean(
    polishLinkedJob && hasStructuredJDContent(polishLinkedJob.structuredJD),
  )

  const polishTooltip = useMemo(() => {
    if (polishJobId == null) {
      return '请先在上方选择「关联岗位」'
    }
    if (!polishLinkedJob) {
      return '请先在上方选择「关联岗位」'
    }
    if (!hasStructuredJDContent(polishLinkedJob.structuredJD)) {
      return '请先在岗位库中对该岗位执行 AI 解析，生成结构化 JD'
    }
    return '结合当前关联岗位的 JD 进行 AI 润色（STAR · 关键词对齐）'
  }, [polishJobId, polishLinkedJob])

  const handlePolishJobChange = useCallback((value) => {
    const n = value === '' ? null : Number(value)
    setPolishJobId(n)
    if (n != null) localStorage.setItem(LS_POLISH_JOB, String(n))
    else localStorage.removeItem(LS_POLISH_JOB)
  }, [])

  const handlePolishRequest = useCallback(
    (section, blockId) => {
      if (!hasAiApiKey()) {
        window.alert('请先在侧栏「设置」中配置 API Key')
        return
      }
      const job = jobs.find((j) => j.id === polishJobId)
      if (!job || !hasStructuredJDContent(job.structuredJD)) {
        window.alert('请先在上方选择已解析出结构化 JD 的岗位')
        return
      }
      const list = sections[section]
      const block = list.find((b) => b.id === blockId)
      if (!block) return
      const before = block.description ?? ''
      setPolishModal({
        section,
        blockId,
        before,
        after: '',
        loading: true,
        error: '',
      })
      void polishResumeExperienceMarkdown({
        markdown: before,
        structuredJD: job.structuredJD,
        jobTitle: job.position ?? '',
        company: job.company ?? '',
      })
        .then((after) => {
          setPolishModal((m) =>
            m && m.blockId === blockId && m.section === section
              ? { ...m, after, loading: false, error: '' }
              : m,
          )
        })
        .catch((e) => {
          setPolishModal((m) =>
            m && m.blockId === blockId && m.section === section
              ? {
                  ...m,
                  loading: false,
                  error: e instanceof Error ? e.message : '润色失败',
                }
              : m,
          )
        })
    },
    [jobs, polishJobId, sections],
  )

  const handlePolishApply = useCallback(() => {
    if (!polishModal || !String(polishModal.after).trim()) return
    patchExperienceBlock(polishModal.section, polishModal.blockId, {
      description: polishModal.after,
    })
    setPolishModal(null)
  }, [patchExperienceBlock, polishModal])

  const handleDragStart = useCallback(
    (event) => {
      const sid = String(event.active.id)
      if (sid.startsWith('palette-')) {
        const expId = Number(sid.replace('palette-', ''))
        const exp = experiences.find((e) => e.id === expId)
        if (exp) setOverlay({ type: 'palette', exp })
        return
      }
      const parsed = parseBlockPointer(event.active.id)
      if (!parsed) return
      const list =
        parsed.key === 'work'
          ? sections.work
          : parsed.key === 'projects'
            ? sections.projects
            : parsed.key === 'education'
              ? sections.education
              : sections.campus
      const block = list.find((b) => b.id === parsed.blockId)
      if (block) setOverlay({ type: 'block', block })
    },
    [
      experiences,
      sections.campus,
      sections.education,
      sections.projects,
      sections.work,
    ],
  )

  const handleDragEnd = useCallback(
    (event) => {
      setOverlay(null)
      const { active, over } = event
      if (!over) return

      const activeId = String(active.id)
      const overId = String(over.id)

      if (active.data.current?.kind === 'palette') {
        const expId = active.data.current.experienceId
        const exp = experiences.find((e) => e.id === expId)
        if (!exp) return

        const zone = zoneFromOverId(overId)
        if (!zone || !categoryMatchesZone(exp, zone)) return

        const block = createResumeBlockFromExperience(exp)
        setSections((prev) => {
          const list = [...prev[zone]]
          let insertAt = list.length
          const hit = parseBlockPointer(overId)
          if (hit && hit.key === zone) {
            const i = list.findIndex((b) => b.id === hit.blockId)
            if (i >= 0) insertAt = i
          }
          list.splice(insertAt, 0, block)
          return { ...prev, [zone]: list }
        })
        return
      }

      if (active.data.current?.kind !== 'block') return

      const activeHit = parseBlockPointer(activeId)
      if (!activeHit) return

      const zoneDropIds = [
        'zone-education',
        'zone-work',
        'zone-projects',
        'zone-campus',
      ]
      if (zoneDropIds.includes(overId)) {
        const targetZone = /** @type {ResumeBlockSectionKey} */ (
          zoneFromOverId(overId)
        )
        const sourceKey = activeHit.key
        if (sourceKey === targetZone) return
        setSections((prev) => {
          const from = [...prev[sourceKey]]
          const to = [...prev[targetZone]]
          const idx = from.findIndex((b) => b.id === activeHit.blockId)
          if (idx === -1) return prev
          const [item] = from.splice(idx, 1)
          to.push(item)
          return { ...prev, [sourceKey]: from, [targetZone]: to }
        })
        return
      }

      const overHit = parseBlockPointer(overId)
      if (!overHit) return

      if (activeHit.key === overHit.key) {
        setSections((prev) => {
          const key = activeHit.key
          const list = prev[key]
          const oldIndex = list.findIndex((b) => b.id === activeHit.blockId)
          const newIndex = list.findIndex((b) => b.id === overHit.blockId)
          if (oldIndex < 0 || newIndex < 0) return prev
          return {
            ...prev,
            [key]: arrayMove(list, oldIndex, newIndex),
          }
        })
        return
      }

      setSections((prev) => {
        const fromKey = activeHit.key
        const toKey = overHit.key
        const from = [...prev[fromKey]]
        const to = [...prev[toKey]]
        const fromIdx = from.findIndex((b) => b.id === activeHit.blockId)
        if (fromIdx === -1) return prev
        const [item] = from.splice(fromIdx, 1)
        let toIdx = to.findIndex((b) => b.id === overHit.blockId)
        if (toIdx < 0) toIdx = to.length
        to.splice(toIdx, 0, item)
        return { ...prev, [fromKey]: from, [toKey]: to }
      })
    },
    [experiences],
  )

  const handleExportPdf = useCallback(async () => {
    const el = a4Ref.current
    if (!el) return
    setExporting(true)
    try {
      const savedName = await exportResumeToPdf(el, title)
      window.alert(`简历（${savedName}）已导出`)
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : '导出失败，请稍后重试。',
      )
    } finally {
      setExporting(false)
    }
  }, [title])

  if (bootError) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center text-sm text-red-600">
        {bootError}
      </div>
    )
  }

  if (resumeId == null) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-500">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        正在加载简历…
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 space-y-3 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="resume-picker">
            选择简历
          </label>
          <select
            id="resume-picker"
            value={resumeId ?? ''}
            onChange={(e) => void handlePickResume(Number(e.target.value))}
            className="min-w-[10rem] rounded-md border border-gray-200 bg-white px-2.5 py-2 text-[12px] font-medium text-gray-800 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {[...resumes]
              .sort((a, b) => a.id - b.id)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id === resumeId ? title : r.title}
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={() => void handleNewResume()}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <FilePlus className="size-3.5" strokeWidth={1.75} aria-hidden />
            新建简历
          </button>
          <button
            type="button"
            onClick={() => void handleDuplicateResume()}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Copy className="size-3.5" strokeWidth={1.75} aria-hidden />
            复制简历
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteResume()}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-100 bg-white px-2.5 py-2 text-[11px] font-medium text-red-600 shadow-sm hover:bg-red-50"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
            删除简历
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2">
          <label
            htmlFor="resume-polish-job"
            className="text-[11px] font-medium text-gray-600"
          >
            关联岗位（AI 润色）
          </label>
          <select
            id="resume-polish-job"
            value={polishJobId ?? ''}
            onChange={(e) => handlePolishJobChange(e.target.value)}
            className="max-w-[min(100%,20rem)] rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-800 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <option value="">不关联</option>
            {[...jobs]
              .sort((a, b) => b.id - a.id)
              .map((j) => (
                <option key={j.id} value={j.id}>
                  {j.company || '—'} · {j.position || '未命名'}
                </option>
              ))}
          </select>
          {polishJobId != null && !polishReady ? (
            <span className="text-[10px] text-amber-700">
              该岗位需在岗位库中解析 JD 后方可润色
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="resume-title-input">
              简历标题
            </label>
            <input
              id="resume-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full max-w-md rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] font-semibold text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="简历名称"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              A4 画布宽约 794px；切换或新建前会自动保存当前简历。
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleExportPdf()}
            disabled={exporting}
            aria-busy={exporting}
            className={cn(
              'inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md hover:bg-gray-800 disabled:pointer-events-none disabled:opacity-55',
            )}
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" strokeWidth={2} aria-hidden />
            )}
            {exporting ? '正在导出…' : '导出 PDF'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setOverlay(null)}
        >
          <MaterialDrawer experiences={experiences} />
          <ResumeA4Canvas
            ref={a4Ref}
            sections={sections}
            layout={layout}
            patchBasics={patchBasics}
            patchSelfEval={patchSelfEval}
            addCustomModule={addCustomModule}
            patchCustomModule={patchCustomModule}
            removeCustomModule={removeCustomModule}
            addStandardLayoutModule={addStandardLayoutModule}
            removeStandardLayoutModule={removeStandardLayoutModule}
            patchExperienceBlock={patchExperienceBlock}
            removeExperienceBlock={removeExperienceBlock}
            onRequestPolish={handlePolishRequest}
            polishDisabled={!polishReady}
            polishTooltip={polishTooltip}
          />
          <DragOverlay dropAnimation={null}>
            {overlay?.type === 'palette' ? (
              <div className="w-64 rounded-lg border border-gray-300 bg-white p-2 shadow-xl">
                <div className="text-[12px] font-semibold text-gray-900">
                  {overlay.exp.company}
                </div>
                <div className="text-[11px] text-gray-600">{overlay.exp.role}</div>
              </div>
            ) : overlay?.type === 'block' ? (
              <div className="w-72 rounded-md border border-gray-300 bg-white p-3 shadow-xl">
                <div className="text-[12px] font-semibold text-gray-900">
                  {overlay.block.company}
                </div>
                <div className="text-[11px] text-gray-600">{overlay.block.role}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <ResumePolishModal
        open={Boolean(polishModal)}
        beforeMarkdown={polishModal?.before ?? ''}
        afterMarkdown={polishModal?.after ?? ''}
        loading={polishModal?.loading ?? false}
        error={polishModal?.error ?? ''}
        onClose={() => setPolishModal(null)}
        onApply={handlePolishApply}
      />
    </div>
  )
}
