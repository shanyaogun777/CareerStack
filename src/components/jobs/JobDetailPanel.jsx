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
import { appInterviewJob } from '../../lib/appPaths'
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
      <div className="shrink-0 border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-slate-800">
              {job.position || '未命名职位'}
            </h2>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{job.company || '—'}</p>
            {job.url ? (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 inline-block max-w-full truncate text-xs text-indigo-400/85 hover:underline"
              >
                {job.url}
              </a>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-slate-200/90 p-2 text-slate-400 transition-colors hover:bg-slate-50/90 hover:text-slate-600"
              title="编辑"
            >
              <Pencil className="size-[18px]" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-100/90 p-2 text-red-500/90 transition-colors hover:bg-red-50/80"
              title="删除"
            >
              <Trash2 className="size-[18px]" strokeWidth={1.5} />
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
            className="w-full rounded-lg border border-slate-200/90 bg-slate-50/80 px-2 py-1.5 text-xs font-medium text-slate-700"
          >
            {JOB_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <Link
          to={appInterviewJob(job.id)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-100/90 bg-indigo-50/50 px-3 py-2.5 text-[12px] font-semibold text-indigo-900/80 shadow-sm transition-colors hover:bg-indigo-50/80"
        >
          <ClipboardList className="size-[18px] shrink-0 text-indigo-400/80" strokeWidth={1.5} aria-hidden />
          进入专项面试工作台
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <section className="mb-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              匹配度诊断
            </h3>
            {m && matchFresh ? (
              <span className="text-[10px] font-medium text-emerald-500/90">已缓存</span>
            ) : null}
          </div>
          <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
            勾选用于分析的素材（默认勾选推荐项），将结合岗位 JD 与素材生成评分。
          </p>
          <div className="mb-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
            {experiences.length === 0 ? (
              <p className="text-[11px] text-slate-400">个人信息库暂无条目</p>
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
                    className="mt-0.5 text-slate-700"
                  />
                  <span className="text-[11px] leading-snug text-slate-600">
                    <span className="font-medium text-slate-700">{exp.company}</span> · {exp.role}
                    {recIds.has(exp.id) ? (
                      <span className="ml-1 text-[10px] text-indigo-400/85">推荐</span>
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            {matchLoading ? (
              <Loader2 className="size-[18px] animate-spin text-white/90" strokeWidth={1.5} aria-hidden />
            ) : (
              <Sparkles className="size-[18px] text-white/90" strokeWidth={1.5} aria-hidden />
            )}
            {matchLoading ? '分析中…' : '匹配度诊断'}
          </button>
          {matchError ? (
            <p className="mt-2 text-[11px] text-red-600" role="alert">
              {matchError}
            </p>
          ) : null}

          {m && m.score != null ? (
            <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              {!matchFresh ? (
                <p className="mb-2 text-[10px] text-amber-700">
                  JD 或所选素材与缓存不一致，建议重新运行「匹配度诊断」。
                </p>
              ) : null}
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-600">综合匹配度</span>
                <span className="text-lg font-bold tabular-nums text-slate-800">{m.score}</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400/75 to-emerald-400/70 transition-[width]"
                  style={{ width: `${Math.min(100, Math.max(0, m.score))}%` }}
                />
              </div>
              {m.keywords?.length ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {m.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full border border-slate-100 bg-slate-50/90 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 space-y-2 text-[11px]">
                <div>
                  <div className="font-semibold text-slate-800">优势</div>
                  <ul className="mt-0.5 list-inside list-disc text-slate-600">
                    {(m.strengths || []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-slate-800">缺失技能</div>
                  <ul className="mt-0.5 list-inside list-disc text-slate-600">
                    {(m.gaps || []).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-slate-800">改进建议</div>
                  <ul className="mt-0.5 list-inside list-disc text-slate-600">
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
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">结构化 JD</h3>
          <div className="space-y-3 text-[12px] leading-relaxed text-slate-600">
            <div>
              <div className="mb-0.5 font-semibold text-slate-800">核心职责</div>
              <div className="whitespace-pre-wrap rounded-lg bg-slate-50/80 p-2.5 text-slate-600">
                {s?.核心职责?.trim() || '—'}
              </div>
            </div>
            <div>
              <div className="mb-0.5 font-semibold text-slate-800">任职要求</div>
              <div className="whitespace-pre-wrap rounded-lg bg-slate-50/80 p-2.5 text-slate-600">
                {s?.任职要求?.trim() || '—'}
              </div>
            </div>
            <div>
              <div className="mb-0.5 font-semibold text-slate-800">关键技能点</div>
              {Array.isArray(s?.关键技能点) && s.关键技能点.length > 0 ? (
                <ul className="list-inside list-disc rounded-lg bg-slate-50/80 p-2.5 text-slate-600">
                  {s.关键技能点.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg bg-slate-50/80 p-2.5 text-slate-400">—</div>
              )}
            </div>
            <div>
              <div className="mb-0.5 font-semibold text-slate-800">加分项</div>
              <div className="whitespace-pre-wrap rounded-lg bg-slate-50/80 p-2.5 text-slate-600">
                {s?.加分项?.trim() || '—'}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              推荐素材（按技能关键词匹配）
            </h3>
            <button
              type="button"
              onClick={onNavigateToExperiences}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-400/85 hover:underline"
            >
              <UserSearch className="size-3.5 text-indigo-400/80" strokeWidth={1.5} />
              打开个人信息库
            </button>
          </div>
          {rec.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200/80 bg-slate-50/60 px-4 py-7 text-center text-xs leading-relaxed text-slate-500">
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
