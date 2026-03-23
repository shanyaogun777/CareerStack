import { useCallback, useEffect, useId, useState } from 'react'
import { Loader2, Sparkles, X } from 'lucide-react'
import {
  JOB_STATUSES,
  createEmptyStructuredJD,
  jobRepository,
  normalizeJobStatus,
  normalizeStructuredJD,
  resumeRepository,
} from '../../services/db'
import { hasAiApiKey, parseJobDescription } from '../../services/ai'

const fieldClass =
  'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200'

const labelClass = 'mb-1 block text-xs font-medium text-gray-700'

/**
 * @typedef {Object} JobFormPrefill
 * @property {string} [url]
 * @property {string} [rawJD]
 * @property {string} [company]
 * @property {string} [position]
 * @property {import('../../services/db.js').StructuredJD} [structuredJD]
 */

/** @param {number | null | undefined} ts */
function tsToDateInput(ts) {
  if (ts == null || !Number.isFinite(ts)) return ''
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** @param {string} value */
function dateInputToTs(value) {
  if (!value || !String(value).trim()) return null
  const parts = String(value).split('-').map(Number)
  if (parts.length < 3) return null
  const [y, m, d] = parts
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).getTime()
}

/**
 * @param {{
 *   open: boolean
 *   jobId: number | null
 *   onClose: () => void
 *   onSaved: () => void
 *   prefill?: JobFormPrefill | null
 *   onConsumedPrefill?: () => void
 * }} props
 */
export function JobFormDrawer({ open, jobId, onClose, onSaved, prefill, onConsumedPrefill }) {
  const titleId = useId()
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')

  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState(/** @type {import('../../services/db.js').JobStatus} */ ('待投递'))
  const [rawJD, setRawJD] = useState('')
  const [coreDuty, setCoreDuty] = useState('')
  const [requirements, setRequirements] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [bonus, setBonus] = useState('')
  const [appliedResumeId, setAppliedResumeId] = useState(/** @type {number | null} */ (null))
  const [nextInterviewDate, setNextInterviewDate] = useState('')
  const [resumes, setResumes] = useState(/** @type {import('../../services/db.js').Resume[]} */ ([]))

  const resetEmpty = useCallback(() => {
    setLoadError('')
    setParseError('')
    setCompany('')
    setPosition('')
    setUrl('')
    setStatus('待投递')
    setRawJD('')
    const empty = createEmptyStructuredJD()
    setCoreDuty(empty.核心职责)
    setRequirements(empty.任职要求)
    setSkillsText('')
    setBonus(empty.加分项)
    setAppliedResumeId(null)
    setNextInterviewDate('')
  }, [])

  const applyStructured = useCallback((s) => {
    const n = normalizeStructuredJD(s)
    setCoreDuty(n.核心职责)
    setRequirements(n.任职要求)
    setSkillsText((n.关键技能点 || []).join('\n'))
    setBonus(n.加分项)
  }, [])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    if (jobId == null) {
      resetEmpty()
      return
    }

    ;(async () => {
      try {
        const row = await jobRepository.getById(jobId)
        if (cancelled) return
        if (!row) {
          setLoadError('记录不存在')
          resetEmpty()
          return
        }
        setLoadError('')
        setCompany(row.company)
        setPosition(row.position)
        setUrl(row.url)
        setStatus(normalizeJobStatus(row.status))
        setRawJD(row.rawJD ?? '')
        setAppliedResumeId(
          row.appliedResumeId != null && Number.isFinite(row.appliedResumeId) ? row.appliedResumeId : null,
        )
        setNextInterviewDate(tsToDateInput(row.nextInterviewAt))
        if (row.structuredJD) {
          applyStructured(row.structuredJD)
        } else {
          applyStructured(createEmptyStructuredJD())
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : '加载失败')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, jobId, resetEmpty, applyStructured])

  useEffect(() => {
    if (!open || jobId != null || !prefill) return
    if (prefill.url != null) setUrl(prefill.url)
    if (prefill.rawJD != null) setRawJD(prefill.rawJD)
    if (prefill.company) setCompany(prefill.company)
    if (prefill.position) setPosition(prefill.position)
    if (prefill.structuredJD) {
      applyStructured(prefill.structuredJD)
    }
    onConsumedPrefill?.()
  }, [open, jobId, prefill, applyStructured, onConsumedPrefill])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    resumeRepository
      .getAll()
      .then((rows) => {
        if (!cancelled) setResumes(rows)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const buildStructured = useCallback(() => {
    return normalizeStructuredJD({
      核心职责: coreDuty,
      任职要求: requirements,
      关键技能点: skillsText
        .split(/\n|,|，|、/)
        .map((x) => x.trim())
        .filter(Boolean),
      加分项: bonus,
    })
  }, [coreDuty, requirements, skillsText, bonus])

  const handleAiParse = async () => {
    if (!rawJD.trim()) {
      setParseError('请先粘贴职位描述全文')
      return
    }
    if (!hasAiApiKey()) {
      setParseError('请先在侧栏「设置」中配置 API Key')
      return
    }
    setParseError('')
    setParsing(true)
    try {
      const parsed = await parseJobDescription(rawJD)
      applyStructured(parsed)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : '解析失败')
    } finally {
      setParsing(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const structuredJD = buildStructured()
      const payload = {
        company,
        position,
        url,
        rawJD,
        structuredJD,
        status,
        appliedResumeId,
        nextInterviewAt: dateInputToTs(nextInterviewDate),
      }
      if (jobId == null) {
        await jobRepository.create(payload)
      } else {
        await jobRepository.update(jobId, payload)
      }
      onSaved()
      onClose()
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="absolute inset-0 bg-black/30" aria-label="关闭" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 id={titleId} className="text-sm font-semibold text-gray-900">
            {jobId == null ? '添加岗位' : '编辑岗位'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="关闭"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {loadError ? (
            <p className="text-sm text-red-600" role="alert">
              {loadError}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="job-company">
                公司名称
              </label>
              <input
                id="job-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={fieldClass}
                placeholder="如：某某科技"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="job-position">
                职位名称
              </label>
              <input
                id="job-position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className={fieldClass}
                placeholder="如：前端开发工程师"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="job-url">
                招聘链接
              </label>
              <input
                id="job-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={fieldClass}
                placeholder="https://"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="job-status">
                状态
              </label>
              <select
                id="job-status"
                value={status}
                onChange={(e) =>
                  setStatus(/** @type {import('../../services/db.js').JobStatus} */ (e.target.value))
                }
                className={fieldClass}
              >
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="job-resume">
                投递所用简历
              </label>
              <select
                id="job-resume"
                value={appliedResumeId == null ? '' : String(appliedResumeId)}
                onChange={(e) => {
                  const v = e.target.value
                  setAppliedResumeId(v === '' ? null : Number(v))
                }}
                className={fieldClass}
              >
                <option value="">未选择</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title || `简历 #${r.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="job-next-interview">
                下一场面试日期
              </label>
              <input
                id="job-next-interview"
                type="date"
                value={nextInterviewDate}
                onChange={(e) => setNextInterviewDate(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <label className={labelClass} htmlFor="job-raw-jd">
                职位描述（原文）
              </label>
              <button
                type="button"
                onClick={() => void handleAiParse()}
                disabled={parsing}
                className="inline-flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-50"
              >
                {parsing ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-3.5" strokeWidth={2} aria-hidden />
                )}
                AI 智能解析
              </button>
            </div>
            <textarea
              id="job-raw-jd"
              value={rawJD}
              onChange={(e) => setRawJD(e.target.value)}
              rows={10}
              spellCheck={false}
              className={`${fieldClass} min-h-[200px] resize-y font-mono text-[12px] leading-relaxed`}
              placeholder="将招聘页 JD 全文粘贴到此处…"
            />
            {parseError ? (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {parseError}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-3">
            <p className="mb-2 text-[11px] font-semibold text-gray-600">结构化信息（可手动修改）</p>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>核心职责</label>
                <textarea
                  value={coreDuty}
                  onChange={(e) => setCoreDuty(e.target.value)}
                  rows={4}
                  className={`${fieldClass} resize-y text-[12px]`}
                />
              </div>
              <div>
                <label className={labelClass}>任职要求</label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={4}
                  className={`${fieldClass} resize-y text-[12px]`}
                />
              </div>
              <div>
                <label className={labelClass}>关键技能点（每行一项）</label>
                <textarea
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  rows={4}
                  className={`${fieldClass} resize-y font-mono text-[12px]`}
                  placeholder="React&#10;TypeScript"
                />
              </div>
              <div>
                <label className={labelClass}>加分项</label>
                <textarea
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  rows={2}
                  className={`${fieldClass} resize-y text-[12px]`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 rounded-md bg-gray-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
