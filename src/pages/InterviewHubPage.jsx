import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <ClipboardList className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">
              专项面试工作台
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
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
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <Building2 className="mx-auto size-10 text-gray-300" strokeWidth={1.25} aria-hidden />
          <p className="mt-3 text-sm text-gray-600">暂无岗位</p>
          <p className="mt-1 text-xs text-gray-400">
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
                  to={`/interview/${j.id}`}
                  className="group flex min-h-[88px] items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-violet-200 hover:bg-violet-50/50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2
                        className="size-4 shrink-0 text-gray-400 group-hover:text-violet-600"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className="truncate font-medium text-gray-900">
                        {j.position || '未命名职位'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{j.company || '—'}</p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      题库 {n} 题
                    </p>
                  </div>
                  <ChevronRight
                    className="size-5 shrink-0 text-gray-300 group-hover:text-violet-500"
                    strokeWidth={2}
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
