/**
 * 专项面试工作台：侧栏收起状态（本机 localStorage）。
 */

const LS_KEY = 'careerstack_interview_workspace_panels_v1'

/**
 * @returns {{ navOpen: boolean; stageOpen: boolean }}
 */
export function loadInterviewWorkspacePanels() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { navOpen: true, stageOpen: true }
    const o = JSON.parse(raw)
    return {
      navOpen: o.navOpen !== false,
      stageOpen: o.stageOpen !== false,
    }
  } catch {
    return { navOpen: true, stageOpen: true }
  }
}

/**
 * @param {{ navOpen: boolean; stageOpen: boolean }} state
 */
export function saveInterviewWorkspacePanels(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}
