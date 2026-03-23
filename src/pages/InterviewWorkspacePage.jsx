import {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  GripVertical,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import {
  experienceRepository,
  hashStructuredJD,
  jobRepository,
} from '../services/db'
import {
  extractInterviewQuestionsFromPost,
  generateThreeTargetedInterviewQuestions,
  hasAiApiKey,
  polishInterviewAnswerSTAR,
} from '../services/ai'
import { MarkdownPreview } from '../components/experiences/MarkdownPreview'
import { EmptyState } from '../components/ui/EmptyState'
import { cn } from '../lib/cn'

/**
 * @param {import('../services/db.js').InterviewQuestionItem} q
 */
function questionTitle(q) {
  return (q.content || q.question || '').trim() || '（未命名问题）'
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

  const [parseOpen, setParseOpen] = useState(false)
  const parseRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null))
  const [parseSource, setParseSource] = useState('')

  const persistTimer = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))

  const refreshJob = useCallback(async () => {
    if (invalidId) return
    const row = await jobRepository.getById(idNum)
    setJob(row ?? null)
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
        setJob(j ?? null)
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

  const questions = useMemo(
    () => job?.interviewQuestions ?? [],
    [job?.interviewQuestions],
  )

  const aiList = useMemo(
    () => questions.filter((q) => !q.type || q.type === 'AI_MOCK'),
    [questions],
  )
  const collectedList = useMemo(
    () => questions.filter((q) => q.type === 'USER_COLLECTED'),
    [questions],
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
    setJob((prev) => (prev ? { ...prev, interviewQuestions: list } : prev))
    await jobRepository.update(job.id, { interviewQuestions: list })
    if (selectedQid === qid) {
      setSelectedQid(list[0]?.id ?? null)
    }
    await refreshJob()
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
      const items = await generateThreeTargetedInterviewQuestions(
        job.structuredJD,
        experiences,
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
    setSelectedQid(item.id)
  }

  if (invalidId) {
    return (
      <div className="px-8 py-12 text-center text-sm text-gray-600">
        无效的岗位链接。
        <Link to="/interview" className="ml-2 text-violet-600 hover:underline">
          返回列表
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
      <div className="flex flex-1 items-center justify-center gap-2 py-24 text-sm text-gray-500">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        加载岗位…
      </div>
    )
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col px-4 md:px-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/80 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/interview')}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
            返回列表
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-gray-900">
              {job.position || '未命名职位'}
            </h1>
            <p className="truncate text-xs text-gray-500">{job.company || '—'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] font-semibold text-blue-900 hover:bg-blue-100"
          >
            <Plus className="size-3.5" strokeWidth={2} aria-hidden />
            手动新增问题
          </button>
          <button
            type="button"
            onClick={() => setParseOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
          >
            面经深度解析
          </button>
        </div>
      </header>

      <Group
        orientation="horizontal"
        className="flex min-h-[min(72vh,720px)] flex-1 gap-0"
      >
        <Panel
          id="interview-nav"
          defaultSize={28}
          minSize={16}
          className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 px-3 py-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              题库导航
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <NavSection
              title="AI 模拟题"
              emptyHint="暂无 AI 题"
              emptyDescription="点击右侧「AI 模拟提问」或上方工具生成"
            >
              {aiList.map((q) => (
                <NavItem
                  key={q.id}
                  active={selectedQid === q.id}
                  onClick={() => setSelectedQid(q.id)}
                  onRemove={() => void removeQuestion(q.id)}
                  badgeClass="bg-violet-100 text-violet-800"
                  badge="AI"
                  label={questionTitle(q)}
                />
              ))}
            </NavSection>
            <NavSection
              title="面经 / 手录"
              emptyHint="暂无采集题"
              emptyDescription="使用「面经深度解析」从帖文提取，或手动新增"
              className="mt-3"
            >
              {collectedList.map((q) => (
                <NavItem
                  key={q.id}
                  active={selectedQid === q.id}
                  onClick={() => setSelectedQid(q.id)}
                  onRemove={() => void removeQuestion(q.id)}
                  badgeClass="bg-blue-100 text-blue-800"
                  badge="采集"
                  label={questionTitle(q)}
                />
              ))}
            </NavSection>
          </div>
        </Panel>

        <Separator className="group flex w-3 max-w-[12px] shrink-0 items-center justify-center bg-transparent focus:outline-none data-[separator]:cursor-col-resize">
          <div className="flex h-16 w-1.5 items-center justify-center rounded-full bg-gray-200 transition-colors group-hover:bg-violet-300" />
        </Separator>

        <Panel
          id="interview-editor"
          minSize={45}
          defaultSize={72}
          className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          {selected ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-gray-100 px-4 py-3">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
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
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-900 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={aiMockLoading}
                    onClick={() => void runAiMockThree()}
                    className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-3 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
                  >
                    {aiMockLoading ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Sparkles className="size-3.5" strokeWidth={2} aria-hidden />
                    )}
                    AI 模拟提问（3 道）
                  </button>
                  <button
                    type="button"
                    disabled={polishLoading}
                    onClick={() => void runPolishAnswer()}
                    className="inline-flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-[12px] font-semibold text-violet-900 hover:bg-violet-100 disabled:opacity-50"
                  >
                    {polishLoading ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Wand2 className="size-3.5" strokeWidth={2} aria-hidden />
                    )}
                    AI 优化回答（STAR）
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
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
                  className="min-h-[200px] w-full resize-y rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 font-mono text-[12px] leading-relaxed text-gray-900 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
                {selected.type !== 'USER_COLLECTED' && selected.answerHint?.trim() ? (
                  <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 text-[11px] text-gray-600">
                    <span className="font-semibold text-gray-700">参考思路：</span>
                    {selected.answerHint}
                  </div>
                ) : null}
                {selected.sourceUrl?.trim() ? (
                  <a
                    href={selected.sourceUrl.trim()}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-block text-[11px] text-blue-600 hover:underline"
                  >
                    查看面经原帖
                  </a>
                ) : null}
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    预览
                  </div>
                <div className="rounded-lg border border-gray-100 bg-white p-3">
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
              className="m-4 flex-1 border-0 bg-gray-50/50"
              title="选题开始备战"
              description="从左侧选择题后在右侧撰写 Markdown 草稿；也可用手动新增、面经解析或 AI 模拟题填充题库。"
            />
          )}
        </Panel>
      </Group>

      {manualOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setManualOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-gray-900">手动新增问题</h3>
            <div className="mt-3 space-y-2">
              <textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                rows={3}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-[12px]"
                placeholder="问题内容"
              />
              <input
                type="url"
                value={manualSource}
                onChange={(e) => setManualSource(e.target.value)}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-[12px]"
                placeholder="来源链接（可选）"
              />
              <select
                value={manualCat}
                onChange={(e) =>
                  setManualCat(
                    /** @type {'基础能力'|'项目深挖'|'行为面试'} */ (e.target.value),
                  )
                }
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-[12px]"
              >
                <option value="基础能力">基础能力</option>
                <option value="项目深挖">项目深挖</option>
                <option value="行为面试">行为面试</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-[12px]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void saveManual()}
                disabled={!manualContent.trim()}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {parseOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !parseLoading && setParseOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-gray-900">面经深度解析</h3>
            <p className="mt-1 text-[11px] text-gray-500">
              粘贴面经全文，AI 将拆解为独立问题并加入本题库。
            </p>
            <input
              type="url"
              value={parseSource}
              onChange={(e) => setParseSource(e.target.value)}
              className="mt-3 rounded border border-gray-200 px-2 py-1.5 text-[12px]"
              placeholder="原帖链接（可选，写入每条记录）"
            />
            <textarea
              ref={parseRef}
              defaultValue=""
              rows={12}
              className="mt-2 min-h-[200px] w-full resize-y rounded border border-gray-200 px-2 py-1.5 font-mono text-[11px]"
              placeholder="粘贴面经原文…"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={parseLoading}
                onClick={() => setParseOpen(false)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-[12px]"
              >
                取消
              </button>
              <button
                type="button"
                disabled={parseLoading}
                onClick={() => void runParseFace经()}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                {parseLoading ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
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
      <div className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
        {title}
      </div>
      {n === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-100 bg-gray-50/90 px-2 py-3 text-center">
          <p className="text-[11px] font-medium text-gray-500">{emptyHint}</p>
          {emptyDescription ? (
            <p className="mt-1 text-[10px] leading-relaxed text-gray-400">{emptyDescription}</p>
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
 * }} props
 */
function NavItem({ active, onClick, onRemove, badge, badgeClass, label }) {
  return (
    <li>
      <div
        className={cn(
          'group flex items-start gap-1 rounded-lg border px-2 py-1.5 text-left transition-colors',
          active
            ? 'border-violet-200 bg-violet-50/90'
            : 'border-transparent hover:bg-gray-50',
        )}
      >
        <button
          type="button"
          onClick={onClick}
          className="min-w-0 flex-1 text-left"
        >
          <span
            className={cn('inline-block rounded px-1 py-0.5 text-[9px] font-bold', badgeClass)}
          >
            {badge}
          </span>
          <span className="mt-0.5 block line-clamp-3 text-[11px] font-medium leading-snug text-gray-800">
            {label}
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="shrink-0 rounded p-0.5 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
          title="删除"
          aria-label="删除"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </li>
  )
}
