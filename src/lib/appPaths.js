/** 应用内功能路由前缀（侧栏与业务页均挂载其下） */
export const APP_BASE = '/app'

/**
 * @param {string} sub 相对路径片段，如 `dashboard`、`interview/12`（可带或不带前导 `/`）
 * @returns {string} 如 `/app/dashboard`
 */
export function appPath(sub) {
  const normalized = String(sub).replace(/^\/+/, '')
  return normalized ? `${APP_BASE}/${normalized}` : APP_BASE
}

/**
 * @param {string | number} jobId
 * @returns {string}
 */
export function appInterviewJob(jobId) {
  return `${APP_BASE}/interview/${jobId}`
}
