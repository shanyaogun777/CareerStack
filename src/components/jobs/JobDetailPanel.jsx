import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Loader2, Pencil, Sparkles, Trash2, UserSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  JOB_STATUSES,
  hashStructuredJD,
  jobRepository,
  normalizeJobStatus,
} from '../../services/db'
import { analyzeJobMatch, hasAiApiKey } from '../../services/ai'
import { ExperienceCard } from '../experiences/ExperienceCard'
import { recommendExperiences } from '../../utils/jobExperienceMatch'

/**
 * @param {import('../../services/db.js').Job} job
 * @param {number[]} selectedIds
 */
function isMatchCacheValid(job, selectedIds) {
  const m = job.matchAnalysis
  if (!m) return false
  if (hashStructuredJD(job.structuredJD) !== m.structuredJDHash) return false
  const a = [...selectedIds].sort((x, y) => x - y).join(',')
  const b = [...(m.experienceIds || [])].sort((x, y) => x - y).join(',')
  return a === b
}

/**
 * @param {{
 *   job: import('../../services/db.js').Job
 *   experiences: import('../../services/db.js').Experience[]
 *   onEdit: () => void
 *   onDelete: () => void
 *   onStatusChange: (status: import('../../services/db.js').JobStatus) => void
 *   onNavigateToExperiences: () => void
 *   onJobUpdated: () => void | Promise<void>
 * }} props
 */
export function JobDetailPanel({
  job,
  experiences,
  onEdit,
  onDelete,
  onStatusChange,
  onNavigateToExperiences,
  onJobUpdated,
}) {
  const rec = recommendExperiences(job.structuredJD, experiences, 16)
  const recIds = useMemo(() => new Set(rec.map((e) => e.id)), [rec])

  const [selectedForMatch, setSelectedForMatch] = useState(/** @type {number[]} */ ([]))
  useEffect(() => {
    if (!experiences.length) {
      setSelectedForMatch([])
      return
    }
    const def =
      rec.length > 0
        ? rec.map((e) => e.id)
        : experiences.slice(0, Math.min(3, experiences.length)).map((e) => e.id)
    setSelectedForMatch(def)
  }, [job.id, job.structuredJD, experiences, rec])

  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState('')

  const s = job.structuredJD
  const m = job.matchAnalysis
  const matchFresh = m ? isMatchCacheValid(job, selectedForMatch) : false

  const toggleExp = (id) => {
    setSelectedForMatch((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const runMatch = async () => {
    if (!hasAiApiKey()) {
      setMatchError('请先在「设置」中配置 API Key')
      return
    }
    if (!job.structuredJD || !String(Object.values(job.structuredJD).join('')).trim()) {
      setMatchError('请先完成 JD 解析或编辑结构化信息')
      return
    }
    const picked = experiences.filter((e) => selectedForMatch.includes(e.id))
    if (picked.length === 0) {
      setMatchError('请至少选择一条个人信息库素材')
      return
    }
    setMatchError('')
    setMatchLoading(true)
    try {
      const result = await analyzeJobMatch(job.structuredJD, picked)
      await jobRepository.update(job.id, { matchAnalysis: result })
      await onJobUpdated()
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : '分析失败')
    } finally {
      setMatchLoading(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">{job.position || '未命名职位'}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{job.company || '—'}</p>
            {job.url ? (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 inline-block max-w-full truncate text-xs text-violet-600 hover:underline"
              >
                {job.url}
              </a>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
              title="编辑"
            >
              <Pencil className="size-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md border border-red-100 p-2 text-red-600 hover:bg-red-50"
              title="删除"
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <div className="mt-3">
          <label className="sr-only" htmlFor={`job-status-${job.id}`}>
            投递状态
          </label>
          <select
            id={`job-status-${job.id}`}
            value={normalizeJobStatus(job.status)}
            onChange={(e) =>
              onStatusChange(/** @type {import('../../services/db.js').JobStatus} */ (e.target.value))
            }
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-800"
          >
            {JOB_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <Link
          to={`/interview/${job.id}`}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-[12px] font-semibold text-violet-900 shadow-sm transition-colors hover:bg-violet-100"
        >
          <ClipboardList className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          进入专项面试工作台
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <section className="mb-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              匹配度诊断
            </h3>
            {m && matchFresh ? (
              <span className="text-[10px] font-medium text-emerald-600">已缓存</span>
            ) : null}
          </div>
          <p className="mb-2 text-[11px] text-gray-500">
            勾选用于分析的素材（默认勾选推荐项），将结合岗位 JD 与素材生成评分。
          </p>
          <div className="mb-2 max-h-40 space-y-1 overflow-y-auto rounded-md border border-gray-100 bg-gray-50/80 p-2">
            {experiences.length === 0 ? (
              <p className="text-[11px] text-gray-400">个人信息库暂无条目</p>
            ) : (
              experiences.map((exp) => (
                <label
                  key={exp.id}
                  className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 hover:bg-white"
                >
                  <input
                    type="checkbox"
                    checked={selectedForMatch.includes(exp.id)}
                    onChange={() => toggleExp(exp.id)}
                    className="mt-0.5 text-gray-900"
                  />
                  <span className="text-[11px] leading-snug text-gray-700">
                    <span className="font-medium">{exp.company}</span> · {exp.role}
                    {recIds.has(exp.id) ? (
                      <span className="ml-1 text-[10px] text-violet-600">推荐</span>
                    ) : null}
                  </span>
                </label>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => void runMatch()}
            disabled={matchLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-[12px] font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {matchLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-4" strokeWidth={2} aria-hidden />
            )}
            {matchLoading ? '分析中…' : '匹配度诊断'}
          </button>
          {matchError ? (
            <p className="mt-2 text-[11px] text-red-600" role="alert">
              {matchError}
            </p>
          ) : null}

          {m && m.score != null ? (
            <div className="mt-4 rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
              {!matchFresh ? (
                <p className="mb-2 text-[10px] text-amber-700">
                  JD 或所选素材与缓存不一致，建议重新运行「匹配度诊断」。
                </p>
              ) : null}
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-gray-600">综合匹配度</span>
                <span className="text-lg font-bold tabular-nums text-gray-900">{m.score}</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-[width]"
                  style={{ width: `${Math.min(100, Math.max(0, m.score))}%` }}
                />
              </div>
              {m.keywords?.length ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {m.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-800"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 space-y-2 text-[11px]">
                <div>
                  <div className="font-semibold text-gray-800">优势</div>
                  <ul className="mt-0.5 list-inside list-disc text-gray-600">
                    {(m.strengths || []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">缺失技能</div>
                  <ul className="mt-0.5 list-inside list-disc text-gray-600">
                    {(m.gaps || []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">改进建议</div>
                  <ul className="mt-0.5 list-inside list-disc text-gray-600">
                    {(m.suggestions || []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="mb-6">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">结构化 JD</h3>
          <div className="space-y-3 text-[12px] leading-relaxed text-gray-700">
            <div>
              <div className="mb-0.5 font-semibold text-gray-800">核心职责</div>
              <div className="whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-gray-600">
                {s?.核心职责?.trim() || '—'}
              </div>
            </div>
            <div>
              <div className="mb-0.5 font-semibold text-gray-800">任职要求</div>
              <div className="whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-gray-600">
                {s?.任职要求?.trim() || '—'}
              </div>
            </div>
            <div>
              <div className="mb-0.5 font-semibold text-gray-800">关键技能点</div>
              {Array.isArray(s?.关键技能点) && s.关键技能点.length > 0 ? (
                <ul className="list-inside list-disc rounded-md bg-gray-50 p-2 text-gray-600">
                  {s.关键技能点.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-md bg-gray-50 p-2 text-gray-400">—</div>
              )}
            </div>
            <div>
              <div className="mb-0.5 font-semibold text-gray-800">加分项</div>
              <div className="whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-gray-600">
                {s?.加分项?.trim() || '—'}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              推荐素材（按技能关键词匹配）
            </h3>
            <button
              type="button"
              onClick={onNavigateToExperiences}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-700 hover:underline"
            >
              <UserSearch className="size-3" strokeWidth={2} />
              打开个人信息库
            </button>
          </div>
          {rec.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-6 text-center text-xs text-gray-500">
              暂无匹配。请先完成 AI 解析或手动填写「关键技能点」。
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {rec.map((exp) => (
                <li key={exp.id}>
                  <ExperienceCard experience={exp} onOpen={() => onNavigateToExperiences()} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
