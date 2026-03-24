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
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100/90 text-indigo-400/80">
            <ClipboardList className="size-5" strokeWidth={1.5} aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-800">
              专项面试工作台
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
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
        <div className="rounded-2xl border border-dashed border-slate-200/90 bg-white px-8 py-16 text-center">
          <Building2 className="mx-auto size-10 text-slate-300" strokeWidth={1.5} aria-hidden />
          <p className="mt-3 text-sm leading-relaxed text-slate-600">暂无岗位</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
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
                  className="group flex min-h-[88px] items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-3.5 shadow-sm transition-all duration-200 hover:border-slate-200 hover:bg-slate-50/60"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2
                        className="size-[18px] shrink-0 text-slate-400 transition-colors duration-200 group-hover:text-indigo-400/80"
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
                    className="size-5 shrink-0 text-slate-300 transition-colors duration-200 group-hover:text-indigo-400/75"
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
