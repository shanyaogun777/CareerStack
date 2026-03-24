/**
 * 求职指挥部：从岗位列表派生的纯统计（无 IO）。
 */

import { normalizeJobStatus } from '../services/db.js'

/**
 * @param {import('../services/db.js').Job[]} jobs
 */
export function computeStatusCounts(jobs) {
  let 待投递 = 0
  let 已投递 = 0
  let 面试中 = 0
  let 已录用 = 0
  let 已拒绝 = 0
  for (const j of jobs) {
    switch (normalizeJobStatus(j.status)) {
      case '待投递':
        待投递 += 1
        break
      case '已投递':
        已投递 += 1
        break
      case '面试中':
        面试中 += 1
        break
      case '已录用':
        已录用 += 1
        break
      case '已拒绝':
        已拒绝 += 1
        break
      default:
        待投递 += 1
    }
  }
  const totalSubmitted = 已投递 + 面试中 + 已录用 + 已拒绝
  return {
    total: jobs.length,
    待投递,
    已投递,
    面试中,
    已录用,
    已拒绝,
    totalSubmitted,
  }
}

/**
 * 投递漏斗：已投递 → 面试中 → 已录用（人数，非严格转化）。
 * @param {import('../services/db.js').Job[]} jobs
 */
export function computeFunnel(jobs) {
  const c = computeStatusCounts(jobs)
  return [
    { name: '已投递', value: c.已投递, fill: '#94a3b8' },
    { name: '面试中', value: c.面试中, fill: '#818cf8' },
    { name: '已录用', value: c.已录用, fill: '#6ee7b7' },
  ]
}

/**
 * 过去若干周（每 7 天一段）新增岗位数（按 createdAt）。
 * @param {import('../services/db.js').Job[]} jobs
 * @param {number} weeks
 * @returns {{ label: string; count: number; start: number; end: number }[]}
 */
export function weeklyNewJobs(jobs, weeks = 4) {
  const now = Date.now()
  const DAY = 86400000
  const out = []
  for (let w = weeks - 1; w >= 0; w--) {
    const end = now - w * 7 * DAY
    const start = end - 7 * DAY
    const label = formatWeekLabel(start)
    const count = jobs.filter((j) => j.createdAt >= start && j.createdAt < end).length
    out.push({ label, count, start, end })
  }
  return out
}

/**
 * @param {number} startMs
 */
function formatWeekLabel(startMs) {
  const d = new Date(startMs)
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${m}/${day} 周`
}

/**
 * 简历投递次数排行（appliedResumeId）
 * @param {import('../services/db.js').Job[]} jobs
 * @returns {{ resumeId: number; count: number }[]}
 */
export function resumePopularity(jobs) {
  /** @type {Record<number, number>} */
  const map = {}
  for (const j of jobs) {
    const id = j.appliedResumeId
    if (id == null || !Number.isFinite(id)) continue
    map[id] = (map[id] || 0) + 1
  }
  return Object.entries(map)
    .map(([resumeId, count]) => ({
      resumeId: Number(resumeId),
      count,
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * @param {number | null | undefined} ts
 * @returns {string} YYYY-MM-DD
 */
export function interviewTsToDateValue(ts) {
  if (ts == null || !Number.isFinite(ts)) return ''
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * @param {string} dateStr YYYY-MM-DD
 * @returns {number | null}
 */
export function dateValueToInterviewTs(dateStr) {
  const t = String(dateStr ?? '').trim()
  if (!t) return null
  const d = new Date(`${t}T12:00:00`)
  const ms = d.getTime()
  return Number.isFinite(ms) ? ms : null
}

/**
 * 按本地日聚合有面试的岗位（nextInterviewAt 落在该日 0:00–24:00）
 * @param {import('../services/db.js').Job[]} jobs
 * @returns {Map<string, import('../services/db.js').Job[]>}
 */
export function jobsByInterviewDay(jobs) {
  /** @type {Map<string, import('../services/db.js').Job[]>} */
  const map = new Map()
  for (const j of jobs) {
    const ts = j.nextInterviewAt
    if (ts == null || !Number.isFinite(ts)) continue
    const key = dayKeyLocal(ts)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(j)
  }
  return map
}

/**
 * @param {number} ts
 */
function dayKeyLocal(ts) {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * @param {Date} date
 */
export function dateToDayKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * @param {string} dayKey YYYY-MM-DD
 */
export function isPastDayKey(dayKey) {
  const today = dateToDayKey(new Date())
  return dayKey < today
}

/**
 * @param {Date} date
 */
export function isPastCalendarDate(date) {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d < t
}
