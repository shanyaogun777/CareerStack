import {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { appPath } from '../lib/appPaths'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import {
  INTERVIEW_PREP_DIMENSIONS,
  enrichJobForInterviewWorkspace,
  experienceRepository,
  hashStructuredJD,
  jobRepository,
  normalizeInterviewStageBuckets,
} from '../services/db'
import {
  extractInterviewQuestionsFromPost,
  generateThreeTargetedInterviewQuestions,
  hasAiApiKey,
  polishInterviewAnswerSTAR,
} from '../services/ai'
import {
  getEffectivePrompt,
  saveAiPromptOverrides,
} from '../services/aiPrompts.js'
import {
  INTERVIEW_STAGE_TABS,
  buildCustomStageSystemPrompt,
  getInterviewStageSystemPrompt,
} from '../services/interviewStagePrompts.js'
import {
  getLastInterviewStage,
  setLastInterviewStage,
} from '../services/interviewStagePersistence.js'
import {
  loadInterviewWorkspacePanels,
  saveInterviewWorkspacePanels,
} from '../services/interviewWorkspacePanels.js'
import { MarkdownPreview } from '../components/experiences/MarkdownPreview'
import { EmptyState } from '../components/ui/EmptyState'
import { cn } from '../lib/cn'
import { MAIN_CONTENT_OVERLAY_BOX } from '../lib/overlayLayout.js'

/**
 * @param {import('../services/db.js').InterviewQuestionItem} q
 */
function questionTitle(q) {
  return (q.content || q.question || '').trim() || '（未命名问题）'
}

/**
 * @param {import('../services/db.js').InterviewPrepDimension} d
 */
function prepDimensionBadgeClass(d) {
  switch (d) {
    case '通用':
      return 'bg-slate-100/95 text-slate-700 ring-1 ring-slate-200/80'
    case '业务':
      return 'bg-amber-50/95 text-amber-900/80 ring-1 ring-amber-100/90'
    case '技术':
      return 'bg-indigo-50/95 text-indigo-900/80 ring-1 ring-indigo-100/90'
    case '行为':
      return 'bg-rose-50/95 text-rose-900/80 ring-1 ring-rose-100/90'
    default:
      return 'bg-slate-100/95 text-slate-700 ring-1 ring-slate-200/80'
  }
}

export function InterviewWorkspacePage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const idNum = Number(jobId)
  const invalidId = !Number.isFinite(idNum)

  const [job, setJob] = useState(/** @type {import('../services/db.js').Job | null} */ (null))
  const [experiences, setExperiences] = useState(
    /** @type {import('../services/db.js').Experience[]} */ ([]),
  )
  const [loadError, setLoadError] = useState('')
  const [selectedQid, setSelectedQid] = useState(/** @type {string | null} */ (null))

  const [aiMockLoading, setAiMockLoading] = useState(false)
  const [polishLoading, setPolishLoading] = useState(false)
  const [parseLoading, setParseLoading] = useState(false)

  const [manualOpen, setManualOpen] = useState(false)
  const [manualContent, setManualContent] = useState('')
  const [manualSource, setManualSource] = useState('')
  const [manualCat, setManualCat] = useState(
    /** @type {'基础能力' | '项目深挖' | '行为面试'} */ ('基础能力'),
  )
  const [manualPrepDim, setManualPrepDim] = useState(
    /** @type {import('../services/db.js').InterviewPrepDimension} */ ('通用'),
  )

  const [parseOpen, setParseOpen] = useState(false)
  const parseRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null))
  const [parseSource, setParseSource] = useState('')

  /** @type {import('../services/interviewStagePrompts.js').InterviewStageId} */
  const [interviewStage, setInterviewStage] = useState('round1')
  const [customPromptDraft, setCustomPromptDraft] = useState('')
  const [customPromptSavedHint, setCustomPromptSavedHint] = useState('')

  /** @type {'all' | import('../services/db.js').InterviewPrepDimension} */
  const [prepFilter, setPrepFilter] = useState('all')
  const [panels, setPanels] = useState(() => loadInterviewWorkspacePanels())
  const [activeDragQ, setActiveDragQ] = useState(
    /** @type {import('../services/db.js').InterviewQuestionItem | null} */ (null),
  )

  const persistTimer = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))

  const refreshJob = useCallback(async () => {
    if (invalidId) return
    const row = await jobRepository.getById(idNum)
    setJob(row ? enrichJobForInterviewWorkspace(row) : null)
  }, [idNum, invalidId])

  useEffect(() => {
    if (invalidId) return
    let cancelled = false
    ;(async () => {
      try {
        const [j, ex] = await Promise.all([
          jobRepository.getById(idNum),
          experienceRepository.getAll(),
        ])
        if (cancelled) return
        setJob(j ? enrichJobForInterviewWorkspace(j) : null)
        setExperiences(ex)
        setLoadError('')
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : '加载失败')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [idNum, invalidId])

  useEffect(() => {
    if (!job) return
    setInterviewStage(getLastInterviewStage(job.id))
  }, [job])

  useEffect(() => {
    if (interviewStage !== 'custom') return
    setCustomPromptDraft(getEffectivePrompt('interviewCustom'))
  }, [interviewStage])

  const questions = useMemo(
    () => job?.interviewQuestions ?? [],
    [job?.interviewQuestions],
  )

  const aiList = useMemo(
    () =>
      questions.filter(
        (q) =>
          !q.type ||
          q.type === 'AI_MOCK' ||
          q.type === 'AI_FACE_DIVERGENT',
      ),
    [questions],
  )
  const collectedList = useMemo(
    () => questions.filter((q) => q.type === 'USER_COLLECTED'),
    [questions],
  )

  const faceExpReference = useMemo(
    () =>
      collectedList
        .map((q) => (q.content || q.question || '').trim())
        .filter(Boolean)
        .join('\n---\n')
        .slice(0, 14_000),
    [collectedList],
  )

  const willUseFaceExpDivergent = faceExpReference.trim().length > 0

  const passesPrepFilter = useCallback(
    /** @param {import('../services/db.js').InterviewQuestionItem} q */
    (q) => {
      if (prepFilter === 'all') return true
      return (q.prepDimension ?? '通用') === prepFilter
    },
    [prepFilter],
  )

  const aiListFiltered = useMemo(
    () => aiList.filter(passesPrepFilter),
    [aiList, passesPrepFilter],
  )
  const collectedListFiltered = useMemo(
    () => collectedList.filter(passesPrepFilter),
    [collectedList, passesPrepFilter],
  )

  const stageBucketIds = useMemo(() => {
    if (!job?.interviewStageBuckets) return []
    const b = normalizeInterviewStageBuckets(job.interviewStageBuckets)
    return b[interviewStage] ?? []
  }, [job?.interviewStageBuckets, interviewStage])

  const stageBucketQuestions = useMemo(
    () =>
      stageBucketIds
        .map((id) => questions.find((q) => q.id === id))
        .filter(
          /** @returns {q is import('../services/db.js').InterviewQuestionItem} */
          (q) => Boolean(q),
        ),
    [stageBucketIds, questions],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  useEffect(() => {
    if (!questions.length) {
      setSelectedQid(null)
      return
    }
    if (selectedQid && questions.some((q) => q.id === selectedQid)) return
    setSelectedQid(questions[0].id)
  }, [questions, selectedQid])

  const selected = useMemo(
    () => questions.find((q) => q.id === selectedQid) ?? null,
    [questions, selectedQid],
  )

  const flushPersist = useCallback(() => {
    if (persistTimer.current) {
      clearTimeout(persistTimer.current)
      persistTimer.current = null
    }
  }, [])

  const persistQuestions = useCallback(
    async (list) => {
      if (!job) return
      await jobRepository.update(job.id, { interviewQuestions: list })
      await refreshJob()
    },
    [job, refreshJob],
  )

  const schedulePersist = useCallback(
    (list) => {
      flushPersist()
      persistTimer.current = setTimeout(() => {
        persistTimer.current = null
        void persistQuestions(list)
      }, 450)
    },
    [flushPersist, persistQuestions],
  )

  useEffect(() => () => flushPersist(), [flushPersist])

  const patchQuestion = useCallback(
    (qid, patch) => {
      setJob((prev) => {
        if (!prev) return prev
        const list = (prev.interviewQuestions || []).map((q) =>
          q.id === qid ? { ...q, ...patch } : q,
        )
        schedulePersist(list)
        return { ...prev, interviewQuestions: list }
      })
    },
    [schedulePersist],
  )

  const removeQuestion = async (qid) => {
    if (!job) return
    flushPersist()
    const list = (job.interviewQuestions || []).filter((q) => q.id !== qid)
    const buckets = normalizeInterviewStageBuckets(job.interviewStageBuckets)
    const nextBuckets = {
      round1: buckets.round1.filter((id) => id !== qid),
      round2: buckets.round2.filter((id) => id !== qid),
      hr: buckets.hr.filter((id) => id !== qid),
      custom: buckets.custom.filter((id) => id !== qid),
    }
    setJob((prev) =>
      prev
        ? { ...prev, interviewQuestions: list, interviewStageBuckets: nextBuckets }
        : prev,
    )
    await jobRepository.update(job.id, {
      interviewQuestions: list,
      interviewStageBuckets: nextBuckets,
    })
    if (selectedQid === qid) {
      setSelectedQid(list[0]?.id ?? null)
    }
    await refreshJob()
  }

  const persistBuckets = useCallback(
    async (nextBuckets) => {
      if (!job) return
      await jobRepository.update(job.id, { interviewStageBuckets: nextBuckets })
      await refreshJob()
    },
    [job, refreshJob],
  )

  const addQuestionToCurrentStage = useCallback(
    /** @param {string} qid */
    async (qid) => {
      if (!job) return
      const buckets = normalizeInterviewStageBuckets(job.interviewStageBuckets)
      const key = interviewStage
      const cur = [...buckets[key]]
      if (cur.includes(qid)) return
      const next = { ...buckets, [key]: [...cur, qid] }
      await persistBuckets(next)
    },
    [job, interviewStage, persistBuckets],
  )

  const removeQuestionFromCurrentStage = useCallback(
    /** @param {string} qid */
    async (qid) => {
      if (!job) return
      const buckets = normalizeInterviewStageBuckets(job.interviewStageBuckets)
      const key = interviewStage
      const next = { ...buckets, [key]: buckets[key].filter((id) => id !== qid) }
      await persistBuckets(next)
    },
    [job, interviewStage, persistBuckets],
  )

  const handleDragEnd = useCallback(
    /** @param {import('@dnd-kit/core').DragEndEvent} event */
    async (event) => {
      const { active, over } = event
      setActiveDragQ(null)
      if (!over || !job) return
      if (String(over.id) !== `stage-drop-${interviewStage}`) return
      const qid =
        active.data.current && typeof active.data.current.qid === 'string'
          ? active.data.current.qid
          : String(active.id).replace(/^nav-q-/, '')
      if (!qid) return
      await addQuestionToCurrentStage(qid)
    },
    [job, interviewStage, addQuestionToCurrentStage],
  )

  const toggleNavPanel = () => {
    setPanels((p) => {
      const n = { ...p, navOpen: !p.navOpen }
      saveInterviewWorkspacePanels(n)
      return n
    })
  }

  const toggleStagePanel = () => {
    setPanels((p) => {
      const n = { ...p, stageOpen: !p.stageOpen }
      saveInterviewWorkspacePanels(n)
      return n
    })
  }

  const handleInterviewStageChange = useCallback(
    /** @param {import('../services/interviewStagePrompts.js').InterviewStageId} stage */
    (stage) => {
      setInterviewStage(stage)
      if (job) setLastInterviewStage(job.id, stage)
    },
    [job],
  )

  const saveCustomInterviewPrompt = () => {
    saveAiPromptOverrides({ interviewCustom: customPromptDraft })
    setCustomPromptSavedHint('已写入本机 Prompt 设置')
    window.setTimeout(() => setCustomPromptSavedHint(''), 2400)
  }

  const runAiMockThree = async () => {
    if (!job) return
    if (!hasAiApiKey()) {
      window.alert('请先在「设置」中配置 API Key')
      return
    }
    if (!job.structuredJD || !String(Object.values(job.structuredJD).join('')).trim()) {
      window.alert('请先在岗位库中完成该岗位的 JD 解析')
      return
    }
    setAiMockLoading(true)
    try {
      const systemPrompt =
        interviewStage === 'custom'
          ? buildCustomStageSystemPrompt(customPromptDraft)
          : getInterviewStageSystemPrompt(interviewStage)
      const items = await generateThreeTargetedInterviewQuestions(
        job.structuredJD,
        experiences,
        {
          systemPrompt,
          faceExpReference,
          interviewStage,
          customStageDraft: customPromptDraft,
        },
      )
      const next = [...(job.interviewQuestions || []), ...items]
      await jobRepository.update(job.id, {
        interviewQuestions: next,
        interviewQuestionsHash: hashStructuredJD(job.structuredJD),
      })
      await refreshJob()
      setSelectedQid(items[items.length - 1]?.id ?? null)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '生成失败')
    } finally {
      setAiMockLoading(false)
    }
  }

  const runPolishAnswer = async () => {
    if (!job || !selected) return
    if (!hasAiApiKey()) {
      window.alert('请先在「设置」中配置 API Key')
      return
    }
    const draft = selected.answerDraft ?? ''
    if (!draft.trim()) {
      window.alert('请先填写回答草稿')
      return
    }
    setPolishLoading(true)
    try {
      const out = await polishInterviewAnswerSTAR({
        draftMarkdown: draft,
        structuredJD: job.structuredJD,
        jobTitle: job.position ?? '',
        company: job.company ?? '',
      })
      patchQuestion(selected.id, { answerDraft: out })
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '润色失败')
    } finally {
      setPolishLoading(false)
    }
  }

  const runParseFace经 = async () => {
    if (!job) return
    if (!hasAiApiKey()) {
      window.alert('请先在「设置」中配置 API Key')
      return
    }
    const raw = parseRef.current?.value ?? ''
    setParseLoading(true)
    try {
      const items = await extractInterviewQuestionsFromPost(raw, parseSource)
      if (items.length === 0) {
        window.alert('未识别到有效问题')
        return
      }
      const next = [...(job.interviewQuestions || []), ...items]
      await jobRepository.update(job.id, { interviewQuestions: next })
      await refreshJob()
      setParseOpen(false)
      if (parseRef.current) parseRef.current.value = ''
      setParseSource('')
      setSelectedQid(items[items.length - 1]?.id ?? null)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '解析失败')
    } finally {
      setParseLoading(false)
    }
  }

  const saveManual = async () => {
    if (!job) return
    const text = manualContent.trim()
    if (!text) return
    const item = {
      id: `uc-${Date.now()}`,
      category: manualCat,
      prepDimension: manualPrepDim,
      question: text,
      content: text,
      answerHint: '',
      type: 'USER_COLLECTED',
      sourceUrl: manualSource.trim(),
      answerDraft: '',
      difficulty: 3,
      prepStatus: 'pending',
    }
    const next = [...(job.interviewQuestions || []), item]
    await jobRepository.update(job.id, { interviewQuestions: next })
    await refreshJob()
    setManualOpen(false)
    setManualContent('')
    setManualSource('')
    setManualCat('基础能力')
    setManualPrepDim('通用')
    setSelectedQid(item.id)
  }

  if (invalidId) {
    return (
      <div className="px-8 py-12 text-center text-sm leading-relaxed text-slate-600">
        无效的岗位链接。
        <Link to={appPath('interview')} className="ml-2 text-indigo-400/85 hover:underline">
          返回岗位列表
        </Link>
      </div>
    )
  }

  if (loadError) {
    return (
      <p className="px-8 py-12 text-sm text-red-600" role="alert">
        {loadError}
      </p>
    )
  }

  if (!job) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="size-5 animate-spin text-indigo-400/70" strokeWidth={1.5} aria-hidden />
        加载岗位…
      </div>
    )
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col px-4 md:px-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(appPath('interview'))}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-200/90 bg-white px-3 py-2 text-[12px] font-semibold text-slate-800 shadow-sm transition-colors hover:border-indigo-200/90 hover:bg-indigo-50/40"
          >
            <ArrowLeft className="size-[14px] text-slate-500" strokeWidth={1.5} aria-hidden />
            返回岗位列表
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-slate-800">
              {job.position || '未命名职位'}
            </h1>
            <p className="truncate text-xs leading-relaxed text-slate-500">{job.company || '—'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100/90 bg-indigo-50/50 px-3 py-2 text-[12px] font-semibold text-indigo-900/80 transition-colors hover:bg-indigo-50/80"
          >
            <Plus className="size-[14px] text-indigo-400/80" strokeWidth={1.5} aria-hidden />
            手动新增问题
          </button>
          <button
            type="button"
            onClick={() => setParseOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50/90"
          >
            面经深度解析
          </button>
        </div>
      </header>

      <div
        className="mb-3 flex flex-wrap gap-1 rounded-xl border border-slate-100 bg-slate-50/60 p-1"
        role="tablist"
        aria-label="面试阶段"
      >
        {INTERVIEW_STAGE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={interviewStage === tab.id}
            onClick={() => handleInterviewStageChange(tab.id)}
            className={cn(
              'rounded-lg px-3 py-2 text-left text-[11px] font-semibold transition-colors sm:text-[12px]',
              interviewStage === tab.id
                ? 'bg-white text-indigo-900 shadow-sm ring-1 ring-indigo-100/90'
                : 'text-slate-600 hover:bg-white/70',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {interviewStage === 'custom' ? (
        <div className="mb-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="mb-2 text-[11px] leading-relaxed text-slate-600">
            以下为「自定义」轮次使用的系统提示主体（与设置中「专项面试 · 自定义阶段」同源）。保存后点击右侧「开始模拟」将按此侧重出题；用户消息中仍会附带该岗位的 JD 与简历摘要。
          </p>
          <textarea
            value={customPromptDraft}
            onChange={(e) => setCustomPromptDraft(e.target.value)}
            spellCheck={false}
            rows={6}
            className="w-full resize-y rounded-lg border border-slate-200/90 bg-slate-50/50 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-800 focus:border-indigo-200/90 focus:outline-none focus:ring-2 focus:ring-indigo-50"
            placeholder="描述你希望 AI 面试官侧重考察的方向…"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveCustomInterviewPrompt}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-slate-700"
            >
              保存到 Prompt 设置
            </button>
            {customPromptSavedHint ? (
              <span className="text-[11px] text-emerald-600">{customPromptSavedHint}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        onDragStart={(e) => {
          const raw = String(e.active.id).replace(/^nav-q-/, '')
          const q = questions.find((x) => x.id === raw)
          setActiveDragQ(q ?? null)
        }}
        onDragEnd={(e) => void handleDragEnd(e)}
        onDragCancel={() => setActiveDragQ(null)}
      >
        <div className="flex min-h-[min(72vh,720px)] min-w-0 flex-1 gap-2">
          {panels.navOpen ? (
            <aside className="flex w-[min(30%,300px)] min-w-[200px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-2 py-2">
                <h2 className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  题库导航
                </h2>
                <button
                  type="button"
                  onClick={toggleNavPanel}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                  title="收起题库导航"
                  aria-label="收起题库导航"
                >
                  <ChevronLeft className="size-4" strokeWidth={1.5} />
                </button>
              </div>
              <div className="border-b border-slate-100 px-2.5 py-2">
                <label className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  备战分类筛选
                </label>
                <select
                  value={prepFilter}
                  onChange={(e) =>
                    setPrepFilter(
                      /** @type {'all' | import('../services/db.js').InterviewPrepDimension} */ (
                        e.target.value
                      ),
                    )
                  }
                  className="w-full rounded-lg border border-slate-200/90 bg-slate-50/50 px-2 py-1.5 text-[11px] text-slate-800"
                >
                  <option value="all">全部</option>
                  {INTERVIEW_PREP_DIMENSIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                <NavSection
                  title="AI 模拟题"
                  emptyHint="暂无 AI 题"
                  emptyDescription="选择上方面试阶段后，在右侧点击「开始模拟」生成本题"
                >
                  {aiListFiltered.map((q) => (
                    <DraggableNavShell key={q.id} qid={q.id}>
                      <NavItem
                        active={selectedQid === q.id}
                        onClick={() => setSelectedQid(q.id)}
                        onRemove={() => void removeQuestion(q.id)}
                        badgeClass={
                          q.type === 'AI_FACE_DIVERGENT'
                            ? 'bg-teal-50/95 text-teal-900/80 ring-1 ring-teal-100/90'
                            : 'bg-indigo-50/90 text-indigo-800/75'
                        }
                        badge={
                          q.type === 'AI_FACE_DIVERGENT' ? '基于面经发散' : 'AI'
                        }
                        label={questionTitle(q)}
                        prepDimension={q.prepDimension ?? '通用'}
                      />
                    </DraggableNavShell>
                  ))}
                </NavSection>
                <NavSection
                  title="面经 / 手录"
                  emptyHint="暂无采集题"
                  emptyDescription="使用「面经深度解析」从帖文提取，或手动新增"
                  className="mt-3"
                >
                  {collectedListFiltered.map((q) => (
                    <DraggableNavShell key={q.id} qid={q.id}>
                      <NavItem
                        active={selectedQid === q.id}
                        onClick={() => setSelectedQid(q.id)}
                        onRemove={() => void removeQuestion(q.id)}
                        badgeClass="bg-slate-100/90 text-slate-600"
                        badge="采集"
                        label={questionTitle(q)}
                        prepDimension={q.prepDimension ?? '通用'}
                      />
                    </DraggableNavShell>
                  ))}
                </NavSection>
              </div>
            </aside>
          ) : (
            <button
              type="button"
              onClick={toggleNavPanel}
              className="flex w-9 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-100 bg-white py-2 text-slate-500 shadow-sm transition-colors hover:border-indigo-100 hover:bg-indigo-50/30 hover:text-indigo-700"
              title="展开题库导航"
              aria-label="展开题库导航"
            >
              <ChevronRight className="size-4" strokeWidth={1.5} />
            </button>
          )}

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {selected ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  问题标题
                </label>
                <input
                  type="text"
                  value={questionTitle(selected)}
                  onChange={(e) =>
                    patchQuestion(selected.id, {
                      content: e.target.value,
                      question: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200/90 px-3 py-2 text-[13px] font-medium text-slate-800 focus:border-indigo-200/90 focus:outline-none focus:ring-2 focus:ring-indigo-50"
                />
                <div className="mt-2">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    备战分类
                  </label>
                  <select
                    value={selected.prepDimension ?? '通用'}
                    onChange={(e) =>
                      patchQuestion(selected.id, {
                        prepDimension:
                          /** @type {import('../services/db.js').InterviewPrepDimension} */ (
                            e.target.value
                          ),
                      })
                    }
                    className="w-full max-w-xs rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-[12px] text-slate-800"
                  >
                    {INTERVIEW_PREP_DIMENSIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                    用于题库导航筛选与视觉标签；与左侧「题型」标签（基础能力 / 项目深挖 / 行为面试）可独立设置。
                  </p>
                </div>
                {selected.type === 'AI_FACE_DIVERGENT' ? (
                  <p className="mb-2 rounded-lg border border-teal-100/90 bg-teal-50/45 px-2.5 py-1.5 text-[10px] leading-relaxed text-teal-900/85">
                    本题来源：<span className="font-semibold">基于面经发散</span>
                    。由 AI 根据您题库中的面经/手录考点结合 JD 与简历生成，非原题复述。
                  </p>
                ) : null}
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={aiMockLoading}
                    onClick={() => void runAiMockThree()}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/90 px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
                    aria-busy={aiMockLoading}
                  >
                    {aiMockLoading ? (
                      <Loader2 className="size-[14px] animate-spin text-white/90" strokeWidth={1.5} aria-hidden />
                    ) : (
                      <Sparkles className="size-[14px] text-white/90" strokeWidth={1.5} aria-hidden />
                    )}
                    {aiMockLoading
                      ? willUseFaceExpDivergent
                        ? '面经发散生成中…'
                        : '生成中…'
                      : '开始模拟（3 题）'}
                  </button>
                  <button
                    type="button"
                    disabled={polishLoading}
                    onClick={() => void runPolishAnswer()}
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-100/90 bg-indigo-50/50 px-3 py-2 text-[12px] font-semibold text-indigo-900/80 transition-colors hover:bg-indigo-50/80 disabled:opacity-50"
                  >
                    {polishLoading ? (
                      <Loader2 className="size-[14px] animate-spin text-indigo-400/80" strokeWidth={1.5} aria-hidden />
                    ) : (
                      <Wand2 className="size-[14px] text-indigo-400/80" strokeWidth={1.5} aria-hidden />
                    )}
                    AI 优化回答（STAR）
                  </button>
                  </div>
                  {aiMockLoading && willUseFaceExpDivergent ? (
                    <p className="text-[10px] leading-relaxed text-slate-500" role="status">
                      正在根据面经考点、当前面试阶段侧重、岗位 JD 与简历经历进行交叉发散，请稍候。
                    </p>
                  ) : null}
                  {!aiMockLoading && willUseFaceExpDivergent ? (
                    <p className="text-[10px] leading-relaxed text-slate-500">
                      已检测到「面经 / 手录」题目，本次「开始模拟」将启用面经发散模式；请随时编辑左侧手录题，下次点击即可带上最新内容。
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  回答草稿（Markdown）
                </label>
                <textarea
                  value={selected.answerDraft ?? ''}
                  onChange={(e) =>
                    patchQuestion(selected.id, { answerDraft: e.target.value })
                  }
                  spellCheck={false}
                  rows={14}
                  placeholder="在此撰写答题要点、STAR 结构、案例细节…"
                  className="min-h-[200px] w-full resize-y rounded-lg border border-slate-200/90 bg-slate-50/50 px-3 py-2 font-mono text-[12px] leading-relaxed text-slate-800 focus:border-indigo-200/90 focus:outline-none focus:ring-2 focus:ring-indigo-50"
                />
                {selected.type !== 'USER_COLLECTED' && selected.answerHint?.trim() ? (
                  <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-700">参考思路：</span>
                    {selected.answerHint}
                  </div>
                ) : null}
                {selected.sourceUrl?.trim() ? (
                  <a
                    href={selected.sourceUrl.trim()}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-block text-[11px] text-indigo-400/85 hover:underline"
                  >
                    查看面经原帖
                  </a>
                ) : null}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    预览
                  </div>
                <div className="rounded-lg border border-slate-100 bg-white p-3.5">
                  <MarkdownPreview
                    markdown={selected.answerDraft ?? ''}
                    compact
                    emptyHint="（空草稿）"
                    className="[&_.prose]:text-[12px]"
                  />
                </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              className="m-4 flex-1 border-0 bg-slate-50/50"
              title="选题开始备战"
              description="从左侧选择题后在右侧撰写 Markdown 草稿；也可用手动新增、面经解析或 AI 模拟题填充题库。"
            />
          )}
          </main>

          {panels.stageOpen ? (
            <aside className="flex max-h-full min-h-0 w-[min(22%,220px)] min-w-[168px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-1 border-b border-slate-100 px-2 py-2">
                <h2 className="px-1 text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-500">
                  当前阶段题库
                </h2>
                <button
                  type="button"
                  onClick={toggleStagePanel}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                  title="收起当前阶段题库"
                  aria-label="收起当前阶段题库"
                >
                  <ChevronRight className="size-4" strokeWidth={1.5} />
                </button>
              </div>
              <p className="border-b border-slate-50 px-2.5 py-1.5 text-[10px] leading-relaxed text-slate-500">
                将左侧题目经手柄拖入下方区域，归入「
                {INTERVIEW_STAGE_TABS.find((t) => t.id === interviewStage)?.label ?? ''}
                」。移除仅取消归流，不删原题。
              </p>
              <CurrentStageDropZone stageId={interviewStage}>
                {stageBucketQuestions.length === 0 ? (
                  <p className="px-2 py-6 text-center text-[10px] leading-relaxed text-slate-400">
                    拖入题目开始本阶段备战列表
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {stageBucketQuestions.map((q) => (
                      <li
                        key={q.id}
                        className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 shadow-sm"
                      >
                        <div className="flex items-start gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedQid(q.id)}
                            className="min-w-0 flex-1 text-left text-[10px] font-medium leading-snug text-slate-800"
                          >
                            {questionTitle(q)}
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeQuestionFromCurrentStage(q.id)}
                            className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-red-50/80 hover:text-red-500"
                            title="移出本阶段"
                            aria-label="移出本阶段"
                          >
                            <Trash2 className="size-3" strokeWidth={1.5} />
                          </button>
                        </div>
                        <span
                          className={cn(
                            'mt-1 inline-block rounded px-1 py-0.5 text-[8px] font-bold',
                            prepDimensionBadgeClass(q.prepDimension ?? '通用'),
                          )}
                        >
                          {q.prepDimension ?? '通用'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CurrentStageDropZone>
            </aside>
          ) : (
            <button
              type="button"
              onClick={toggleStagePanel}
              className="flex w-9 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-100 bg-white py-2 text-slate-500 shadow-sm transition-colors hover:border-indigo-100 hover:bg-indigo-50/30 hover:text-indigo-700"
              title="展开当前阶段题库"
              aria-label="展开当前阶段题库"
            >
              <ChevronLeft className="size-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeDragQ ? (
            <div className="max-w-[240px] rounded-lg border border-indigo-100 bg-white px-3 py-2 text-[11px] font-medium text-slate-800 shadow-lg ring-1 ring-indigo-50">
              {questionTitle(activeDragQ)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {manualOpen ? (
        <div
          className={`fixed ${MAIN_CONTENT_OVERLAY_BOX} z-50 flex items-center justify-center bg-black/40 p-4`}
          role="dialog"
          aria-modal="true"
          onClick={() => setManualOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold tracking-tight text-slate-800">手动新增问题</h3>
            <div className="mt-3 space-y-2">
              <textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200/90 px-2.5 py-2 text-[12px] leading-relaxed text-slate-800"
                placeholder="问题内容"
              />
              <input
                type="url"
                value={manualSource}
                onChange={(e) => setManualSource(e.target.value)}
                className="w-full rounded-lg border border-slate-200/90 px-2.5 py-2 text-[12px] text-slate-800"
                placeholder="来源链接（可选）"
              />
              <select
                value={manualCat}
                onChange={(e) =>
                  setManualCat(
                    /** @type {'基础能力'|'项目深挖'|'行为面试'} */ (e.target.value),
                  )
                }
                className="w-full rounded-lg border border-slate-200/90 px-2.5 py-2 text-[12px] text-slate-800"
              >
                <option value="基础能力">基础能力</option>
                <option value="项目深挖">项目深挖</option>
                <option value="行为面试">行为面试</option>
              </select>
              <label className="mb-0.5 block text-[10px] font-medium text-slate-500">
                备战分类
              </label>
              <select
                value={manualPrepDim}
                onChange={(e) =>
                  setManualPrepDim(
                    /** @type {import('../services/db.js').InterviewPrepDimension} */ (
                      e.target.value
                    ),
                  )
                }
                className="w-full rounded-lg border border-slate-200/90 px-2.5 py-2 text-[12px] text-slate-800"
              >
                {INTERVIEW_PREP_DIMENSIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="rounded-lg border border-slate-200/90 px-3 py-1.5 text-[12px] text-slate-700 transition-colors hover:bg-slate-50/90"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void saveManual()}
                disabled={!manualContent.trim()}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {parseOpen ? (
        <div
          className={`fixed ${MAIN_CONTENT_OVERLAY_BOX} z-50 flex items-center justify-center bg-black/40 p-4`}
          role="dialog"
          aria-modal="true"
          onClick={() => !parseLoading && setParseOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold tracking-tight text-slate-800">面经深度解析</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              粘贴面经全文，AI 将拆解为独立问题并加入本题库。
            </p>
            <input
              type="url"
              value={parseSource}
              onChange={(e) => setParseSource(e.target.value)}
              className="mt-3 rounded-lg border border-slate-200/90 px-2.5 py-2 text-[12px] text-slate-800"
              placeholder="原帖链接（可选，写入每条记录）"
            />
            <textarea
              ref={parseRef}
              defaultValue=""
              rows={12}
              className="mt-2 min-h-[200px] w-full resize-y rounded-lg border border-slate-200/90 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-slate-800"
              placeholder="粘贴面经原文…"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={parseLoading}
                onClick={() => setParseOpen(false)}
                className="rounded-lg border border-slate-200/90 px-3 py-1.5 text-[12px] text-slate-700 transition-colors hover:bg-slate-50/90"
              >
                取消
              </button>
              <button
                type="button"
                disabled={parseLoading}
                onClick={() => void runParseFace经()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/90 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                {parseLoading ? (
                  <Loader2 className="size-[14px] animate-spin text-white/90" strokeWidth={1.5} aria-hidden />
                ) : null}
                解析并插入
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * @param {{ qid: string; children: import('react').ReactNode }} props
 */
function DraggableNavShell({ qid, children }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `nav-q-${qid}`,
    data: { qid },
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-45')}
    >
      <div className="flex items-start gap-0.5">
        <button
          type="button"
          className="mt-1 shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          {...listeners}
          {...attributes}
          aria-label="拖到当前阶段题库"
        >
          <GripVertical className="size-3.5" strokeWidth={1.5} />
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </li>
  )
}

/**
 * @param {{ stageId: import('../services/interviewStagePrompts.js').InterviewStageId; children: import('react').ReactNode }} props
 */
function CurrentStageDropZone({ stageId, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-drop-${stageId}`,
  })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'mx-2 mb-2 flex min-h-[min(28vh,200px)] flex-1 flex-col overflow-y-auto rounded-lg border border-dashed p-2 transition-colors',
        isOver
          ? 'border-indigo-300 bg-indigo-50/40'
          : 'border-slate-200/80 bg-slate-50/55',
      )}
    >
      {children}
    </div>
  )
}

/**
 * @param {{
 *   title: string
 *   emptyHint: string
 *   emptyDescription?: string
 *   children: import('react').ReactNode
 *   className?: string
 * }} props
 */
function NavSection({ title, emptyHint, emptyDescription, children, className }) {
  const n = Children.count(children)
  return (
    <div className={className}>
      <div className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {title}
      </div>
      {n === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-100 bg-slate-50/80 px-2 py-3 text-center">
          <p className="text-[11px] font-medium text-slate-500">{emptyHint}</p>
          {emptyDescription ? (
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{emptyDescription}</p>
          ) : null}
        </div>
      ) : (
        <ul className="flex flex-col gap-1">{children}</ul>
      )}
    </div>
  )
}

/**
 * @param {{
 *   active: boolean
 *   onClick: () => void
 *   onRemove: () => void
 *   badge: string
 *   badgeClass: string
 *   label: string
 *   prepDimension: import('../services/db.js').InterviewPrepDimension
 * }} props
 */
function NavItem({
  active,
  onClick,
  onRemove,
  badge,
  badgeClass,
  label,
  prepDimension,
}) {
  const dim = prepDimension ?? '通用'
  return (
    <div
      className={cn(
        'group flex items-start gap-1 rounded-lg border px-2 py-1.5 text-left transition-colors',
        active
          ? 'border-indigo-100/90 bg-indigo-50/50'
          : 'border-transparent hover:bg-slate-50/80',
      )}
    >
      <button type="button" onClick={onClick} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-1">
          <span
            className={cn('inline-block rounded px-1 py-0.5 text-[9px] font-bold', badgeClass)}
          >
            {badge}
          </span>
          <span
            className={cn(
              'inline-block rounded px-1 py-0.5 text-[8px] font-bold',
              prepDimensionBadgeClass(dim),
            )}
          >
            {dim}
          </span>
        </div>
        <span className="mt-0.5 block line-clamp-3 text-[11px] font-medium leading-snug text-slate-800">
          {label}
        </span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="shrink-0 rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-50/80 hover:text-red-500/90 group-hover:opacity-100"
        title="删除"
        aria-label="删除"
      >
        <Trash2 className="size-[14px]" strokeWidth={1.5} />
      </button>
    </div>
  )
}
