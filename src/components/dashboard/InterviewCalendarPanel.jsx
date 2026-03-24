import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { CalendarDays, Trash2 } from 'lucide-react'
import { calendarTodoRepository } from '../../services/db'
import {
  dateToDayKey,
  isPastCalendarDate,
  isPastDayKey,
  jobsByInterviewDay,
} from '../../utils/dashboardStats'
import { cn } from '../../lib/cn'
import { appInterviewJob } from '../../lib/appPaths'

/**
 * @param {import('../../services/db.js').CalendarTodo[]} rows
 */
function buildTodosMap(rows) {
  const m = new Map()
  for (const t of rows) {
    if (!m.has(t.dateKey)) m.set(t.dateKey, [])
    m.get(t.dateKey).push(t)
  }
  return m
}

/**
 * @param {{ jobs: import('../../services/db.js').Job[] }} props
 */
export function InterviewCalendarPanel({ jobs }) {
  const [calDate, setCalDate] = useState(/** @type {Date} */ (new Date()))
  const [draft, setDraft] = useState('')
  const [todosMap, setTodosMap] = useState(
    /** @type {Map<string, import('../../services/db.js').CalendarTodo[]>} */ (new Map()),
  )

  const byDay = useMemo(() => jobsByInterviewDay(jobs), [jobs])

  const reloadTodos = useCallback(async () => {
    const rows = await calendarTodoRepository.getAll()
    setTodosMap(buildTodosMap(rows))
  }, [])

  useEffect(() => {
    let cancelled = false
    calendarTodoRepository.getAll().then((rows) => {
      if (cancelled) return
      setTodosMap(buildTodosMap(rows))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const dayKey = useMemo(() => dateToDayKey(calDate), [calDate])
  const dayJobs = byDay.get(dayKey) ?? []
  const dayTodos = useMemo(() => {
    const list = todosMap.get(dayKey) ?? []
    return [...list].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1
      return a.id - b.id
    })
  }, [dayKey, todosMap])

  const selectedIsPast = isPastDayKey(dayKey)

  const onCalChange = (v) => {
    if (v instanceof Date) setCalDate(v)
  }

  const addTodo = async () => {
    const text = draft.trim()
    if (!text) return
    await calendarTodoRepository.create({
      dateKey: dayKey,
      content: text,
      isCompleted: false,
      jobId: null,
    })
    setDraft('')
    await reloadTodos()
  }

  const toggleTodo = async (id, next) => {
    await calendarTodoRepository.update(id, { isCompleted: next })
    await reloadTodos()
  }

  const removeTodo = async (id) => {
    await calendarTodoRepository.remove(id)
    await reloadTodos()
  }

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null
    const k = dateToDayKey(date)
    const hasInterview = byDay.has(k)
    const hasTodo = (todosMap.get(k)?.length ?? 0) > 0
    const past = isPastCalendarDate(date)
    return cn(
      hasInterview || hasTodo ? 'has-activity' : null,
      past ? 'is-past-day' : null,
    )
  }

  /**
   * @param {{ date: Date; view: string }} p
   */
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null
    const k = dateToDayKey(date)
    const jlist = byDay.get(k) ?? []
    const tlist = todosMap.get(k) ?? []
    if (jlist.length === 0 && tlist.length === 0) return null
    const past = isPastCalendarDate(date)
    return (
      <div
        className={cn(
          'mt-0.5 flex max-w-[5.25rem] flex-wrap justify-center gap-0.5 px-0.5 pb-0.5 transition-opacity duration-200',
          past && 'opacity-55',
        )}
      >
        {jlist.map((j) => (
          <span
            key={`iv-${j.id}`}
            className="h-[3px] w-4 shrink-0 rounded-[1px] bg-slate-500/45"
            title={`面试 · ${j.company}`}
            aria-hidden
          />
        ))}
        {tlist.map((t) => (
          <span
            key={t.id}
            className={cn(
              'h-[3px] w-4 shrink-0 rounded-[1px] bg-slate-400/70 transition-opacity duration-200',
              t.isCompleted && 'opacity-35',
            )}
            title={t.content.slice(0, 40)}
            aria-hidden
          />
        ))}
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-[18px] text-slate-400" strokeWidth={1.5} aria-hidden />
            <h2 className="text-sm font-semibold tracking-tight text-slate-800">面试日历</h2>
          </div>
          <p className="mt-1.5 max-w-xl text-[12px] leading-relaxed text-slate-600">
            岗位「下一场面试」自动出现在对应日期；可添加本地待办。数据仅存于本机 IndexedDB。
          </p>
        </div>
      </div>

      <div className="careerstack-calendar mx-auto w-full max-w-xl">
        <Calendar
          value={calDate}
          onChange={onCalChange}
          locale="zh-CN"
          minDetail="month"
          maxDetail="month"
          showNeighboringMonth={false}
          tileClassName={tileClassName}
          tileContent={tileContent}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/50 p-6 transition-colors duration-200">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
          <span className="text-[12px] font-medium tabular-nums text-slate-700">{dayKey}</span>
          <span className="text-[10px] text-slate-400">待办与面试</span>
        </div>

        <div className="space-y-3">
          {dayJobs.map((j) => (
            <div
              key={j.id}
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/90 px-3 py-2.5 transition-opacity duration-200',
                selectedIsPast && 'opacity-80',
              )}
            >
              <div
                className={cn(
                  'min-w-0 flex-1 text-[13px] leading-snug text-slate-700',
                  selectedIsPast && 'text-slate-400 line-through',
                )}
              >
                <span className="font-medium">面试</span>
                <span className="mx-1.5 text-slate-400">·</span>
                <span className="text-slate-600">
                  {j.company} · {j.position}
                </span>
              </div>
              <Link
                to={appInterviewJob(j.id)}
                className={cn(
                  'shrink-0 text-[11px] font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-800',
                  selectedIsPast && 'text-slate-400 line-through',
                )}
              >
                面试准备
              </Link>
            </div>
          ))}

          {dayTodos.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3.5 py-2.5 transition-shadow duration-200"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={t.isCompleted}
                aria-label={t.isCompleted ? '标记为未完成' : '标记为已完成'}
                onClick={() => void toggleTodo(t.id, !t.isCompleted)}
                className={cn(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-all duration-200',
                  t.isCompleted
                    ? 'border-slate-400 bg-slate-400'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
              >
                {t.isCompleted ? (
                  <span className="block size-1.5 rounded-full bg-white" aria-hidden />
                ) : null}
              </button>
              <p
                className={cn(
                  'min-w-0 flex-1 text-[13px] leading-snug text-slate-700 transition-all duration-200',
                  (selectedIsPast || t.isCompleted) && 'text-slate-400 line-through',
                )}
              >
                {t.content}
              </p>
              <button
                type="button"
                onClick={() => void removeTodo(t.id)}
                className="shrink-0 rounded p-1 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-500"
                aria-label="删除待办"
              >
                <Trash2 className="size-[14px]" strokeWidth={1.5} />
              </button>
            </div>
          ))}

          {dayJobs.length === 0 && dayTodos.length === 0 ? (
            <p className="py-2 text-center text-[12px] text-slate-400">当日暂无事项</p>
          ) : null}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <label className="sr-only" htmlFor="calendar-todo-input">
            添加待办
          </label>
          <input
            id="calendar-todo-input"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void addTodo()
              }
            }}
            placeholder="输入待办，回车添加…"
            className="w-full rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 transition-colors duration-200 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100"
          />
        </div>
      </div>
    </section>
  )
}
