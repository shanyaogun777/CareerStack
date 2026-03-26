/**
 * 按岗位记录专项面试工作台最后选中的轮次（localStorage）。
 */

const LS_KEY = 'careerstack_interview_last_stage_v1'

/** @type {import('./interviewStagePrompts.js').InterviewStageId[]} */
const VALID = ['round1', 'round2', 'hr', 'custom']

/**
 * @param {number} jobId
 * @returns {import('./interviewStagePrompts.js').InterviewStageId}
 */
export function getLastInterviewStage(jobId) {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return 'round1'
    const o = JSON.parse(raw)
    if (!o || typeof o !== 'object') return 'round1'
    const v = o[String(jobId)]
    if (typeof v === 'string' && VALID.includes(v)) {
      return /** @type {import('./interviewStagePrompts.js').InterviewStageId} */ (v)
    }
  } catch {
    /* ignore */
  }
  return 'round1'
}

/**
 * @param {number} jobId
 * @param {import('./interviewStagePrompts.js').InterviewStageId} stage
 */
export function setLastInterviewStage(jobId, stage) {
  if (!VALID.includes(stage)) return
  try {
    const raw = localStorage.getItem(LS_KEY)
    const o = raw ? JSON.parse(raw) : {}
    const next = o && typeof o === 'object' ? { ...o } : {}
    next[String(jobId)] = stage
    localStorage.setItem(LS_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}
