import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Award,
  Briefcase,
  Loader2,
  Send,
  TrendingUp,
  Users,
} from 'lucide-react'
import { jobRepository, resumeRepository } from '../services/db'
import {
  computeFunnel,
  computeStatusCounts,
  resumePopularity,
  weeklyNewJobs,
} from '../utils/dashboardStats'
import { InterviewCalendarPanel } from '../components/dashboard/InterviewCalendarPanel'
import { cn } from '../lib/cn'

export function Dashboard() {
  const [jobs, setJobs] = useState(/** @type {import('../services/db.js').Job[]} */ ([]))
  const [resumes, setResumes] = useState(/** @type {import('../services/db.js').Resume[]} */ ([]))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    try {
      const [j, r] = await Promise.all([
        jobRepository.getAll(),
        resumeRepository.getAll(),
      ])
      setJobs(j)
      setResumes(r)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const counts = useMemo(() => computeStatusCounts(jobs), [jobs])
  const funnel = useMemo(() => computeFunnel(jobs), [jobs])
  const weeks = useMemo(() => weeklyNewJobs(jobs, 4), [jobs])
  const popular = useMemo(() => resumePopularity(jobs), [jobs])

  const resumeTitle = useCallback(
    (id) => resumes.find((x) => x.id === id)?.title ?? `简历 #${id}`,
    [resumes],
  )

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 py-24 text-sm text-gray-500">
        <Loader2 className="size-5 animate-spin text-violet-600" aria-hidden />
        加载数据…
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] flex-1 space-y-8 px-1 md:px-2">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">求职指挥部</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            岗位数据实时汇总：投递漏斗、周趋势与面试日程。配色对齐 CareerStack 主题色。
          </p>
        </div>
      </header>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={Send}
          label="总投递"
          value={counts.totalSubmitted}
          sub="含已投递 / 面试 / 结果"
          accent="bg-slate-700"
        />
        <StatCard
          icon={Briefcase}
          label="面试中"
          value={counts.面试中}
          sub="当前流程中"
          accent="bg-[#aa3bff]"
        />
        <StatCard
          icon={Award}
          label="已录用"
          value={counts.已录用}
          sub="Offer"
          accent="bg-emerald-600"
        />
        <StatCard
          icon={Users}
          label="待投递"
          value={counts.待投递}
          sub="草稿池"
          accent="bg-amber-500"
        />
        <StatCard
          icon={TrendingUp}
          label="岗位总数"
          value={counts.total}
          sub="含全部状态"
          accent="bg-slate-500"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">投递漏斗</h2>
          <p className="mb-3 text-[11px] text-gray-500">
            各阶段岗位数量（非严格转化率，便于横向对比）
          </p>
          <div className="h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {funnel.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">近 4 周新增岗位</h2>
          <p className="mb-3 text-[11px] text-gray-500">按岗位创建时间（createdAt）统计周活跃度</p>
          <div className="h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeks} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="#64748b" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InterviewCalendarPanel jobs={jobs} />

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">最受欢迎简历版本</h2>
          <p className="mb-4 text-[11px] text-gray-500">
            统计各简历在岗位中关联的投递次数（appliedResumeId）
          </p>
          {popular.length === 0 ? (
            <p className="text-[12px] text-gray-400">
              暂无数据。请在岗位编辑中选择「投递所用简历」。
            </p>
          ) : (
            <ol className="space-y-2">
              {popular.slice(0, 8).map((row, i) => (
                <li
                  key={row.resumeId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-[12px]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-800">
                      {i + 1}
                    </span>
                    <span className="truncate font-medium text-gray-900">
                      {resumeTitle(row.resumeId)}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-gray-600">{row.count} 次</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}

/**
 * @param {{
 *   icon: import('lucide-react').LucideIcon
 *   label: string
 *   value: number
 *   sub: string
 *   accent: string
 *   className?: string
 * }} props
 */
function StatCard({ icon, label, value, sub, accent, className }) {
  const Icon = icon
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{value}</p>
          <p className="mt-0.5 text-[10px] text-gray-400">{sub}</p>
        </div>
        <div className={cn('rounded-lg p-2 text-white', accent)}>
          <Icon className="size-4" strokeWidth={2} aria-hidden />
        </div>
      </div>
    </div>
  )
}
