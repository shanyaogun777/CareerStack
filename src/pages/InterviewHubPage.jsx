import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { appInterviewJob } from '../lib/appPaths'
import { Building2, ChevronRight, ClipboardList } from 'lucide-react'
import { jobRepository } from '../services/db'

export function InterviewHubPage() {
  const [jobs, setJobs] = useState(/** @type {import('../services/db.js').Job[]} */ ([]))
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    jobRepository
      .getAll()
      .then((rows) => {
        if (!cancelled) {
          setJobs(rows)
          setError('')
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '加载失败')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col px-4 md:px-8">
      <header className="mb-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center border border-zinc-200/80 bg-zinc-100/90 text-[var(--color-accent)]/80">
            <ClipboardList className="size-5" strokeWidth={1.5} aria-hidden />
          </div>
          <div>
            <h1 className="font-editorial text-2xl font-medium tracking-tight text-zinc-900">
              专项面试工作台
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600">
              选择目标岗位进入备战空间：管理 AI 模拟题、面经提取与手写记录，集中撰写 Markdown
              答题草稿。
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {jobs.length === 0 && !error ? (
        <div className="border border-dashed border-zinc-200/90 bg-white px-8 py-16 text-center">
          <Building2 className="mx-auto size-10 text-zinc-300" strokeWidth={1.5} aria-hidden />
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">暂无岗位</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            请先在「岗位库」添加岗位并解析 JD，再回到此处备战面试。
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((j) => {
            const n = j.interviewQuestions?.length ?? 0
            return (
              <li key={j.id}>
                <Link
                  to={appInterviewJob(j.id)}
                  className="group flex min-h-[88px] items-center justify-between gap-3 border border-zinc-200/90 bg-white/95 px-5 py-3.5 shadow-[0_10px_24px_rgba(18,18,18,0.04)] transition-all duration-200 hover:border-zinc-300/80 hover:bg-zinc-50/70"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2
                        className="size-[18px] shrink-0 text-zinc-400 transition-colors duration-200 group-hover:text-[var(--color-accent)]"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <span className="truncate font-medium text-slate-800">
                        {j.position || '未命名职位'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs leading-relaxed text-slate-500">{j.company || '—'}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      题库 {n} 题
                    </p>
                  </div>
                  <ChevronRight
                    className="size-5 shrink-0 text-zinc-300 transition-colors duration-200 group-hover:text-[var(--color-accent)]/85"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
