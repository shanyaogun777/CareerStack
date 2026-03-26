/**
 * 专项面试：按轮次注入系统提示词（与 user 消息中的 JD + 经历摘要组合使用）。
 * @module
 */

import { getEffectivePrompt } from './aiPrompts.js'

/** @typedef {'round1' | 'round2' | 'hr' | 'custom'} InterviewStageId */

/** 各阶段与 UI 展示文案 */
export const INTERVIEW_STAGE_TABS = [
  { id: /** @type {InterviewStageId} */ ('round1'), label: '一面（基础/项目）' },
  { id: /** @type {InterviewStageId} */ ('round2'), label: '二面（深度/策略）' },
  { id: /** @type {InterviewStageId} */ ('hr'), label: 'HR 面（素质/文化）' },
  { id: /** @type {InterviewStageId} */ ('custom'), label: '自定义' },
]

export const INTERVIEW_OUTPUT_CONTRACT = `【输出格式要求】
只输出 JSON 数组，不要 markdown 代码围栏，不要任何其他说明文字。
数组长度必须为 3。每项对象键名必须一致：
- "category": 只能是 "基础能力"、"项目深挖"、"行为面试" 之一
- "question": 面试问题全文
- "answerHint": 要点式参考思路（非背诵稿）
三道题须角度有区分，且严格贴合下方用户消息中的岗位 JD 与个人简历摘要。`

/** 面经发散模式下的输出约定（强调交叉 JD/简历，禁止复述第一节原题）。 */
export const INTERVIEW_OUTPUT_CONTRACT_DIVERGENT = `【输出格式要求】
只输出 JSON 数组，不要 markdown 代码围栏，不要任何其他说明文字。
数组长度必须为 3。每项对象键名必须一致：
- "category": 只能是 "基础能力"、"项目深挖"、"行为面试" 之一
- "question": 面试问题全文
- "answerHint": 要点式参考思路（非背诵稿）
三道题须角度有区分；每一问都必须显式融入用户消息第三节 JD 或第四节简历/项目中的具体信息（公司、项目名、技术栈、指标、场景等至少一处可核对细节），不得空泛套话。
严禁将第一节中的面经原句或仅替换个别同义词后再次作为题目输出；须在考点上做深度钻取、交叉追问或场景变形。`

const ROUND1_FOCUS = `【当前轮次：一面】
你是技术/业务一面面试官。提问侧重：
1. 简历与项目细节核实：时间线、职责边界、个人贡献、数据口径。
2. 专业基础：与 JD 技能点相关的概念、常见工程实践（如数据清洗、特征构造、训练/评测流程、API 设计等）。
3. 技术方案落地：在可控深度内追问实现思路（如 SFT 数据构造注意点、评测集设计、线上监控等），不要求空泛宏大叙事。`

const ROUND2_FOCUS = `【当前轮次：二面】
你是资深面试官或用人经理。提问侧重：
1. 产品设计/技术方案在复杂业务下的取舍与演进。
2. 指标体系与效果评估：如何定义好坏、如何做对比实验或离线/在线评估（可涉及指令遵循、安全性、幻觉等业务指标思路）。
3. 逻辑推演与决策：在资源约束、需求变更、风险场景下如何拆解问题并给出可执行路径。`

const HR_FOCUS = `【当前轮次：HR 面】
你是 HR 或文化匹配面试官。提问侧重：
1. 职业动机、稳定性与职业规划（与本公司/岗位合理性）。
2. 团队协作、冲突处理、跨部门沟通的真实案例（STAR）。
3. 压力情境与价值观：加班/优先级/诚信/反馈文化等软性场景，避免纯技术深挖。`

/**
 * 自定义阶段：优先使用工作台当前编辑的文案，空则回退到设置中的 `interviewCustom`。
 * @param {string} [draftFromWorkspace]
 * @returns {string}
 */
export function buildCustomStageSystemPrompt(draftFromWorkspace) {
  const trimmed =
    typeof draftFromWorkspace === 'string' ? draftFromWorkspace.trim() : ''
  const userBody = trimmed || getEffectivePrompt('interviewCustom').trim()
  return `${userBody}\n\n${INTERVIEW_OUTPUT_CONTRACT}`
}

/**
 * 返回该阶段完整的 system 消息（已含 JSON 输出约定）。
 * 「自定义」阶段主体来自设置中 `interviewCustom`，并与本模块的输出约定拼接。
 * @param {InterviewStageId} stageId
 * @returns {string}
 */
export function getInterviewStageSystemPrompt(stageId) {
  switch (stageId) {
    case 'round1':
      return `${ROUND1_FOCUS}\n\n${INTERVIEW_OUTPUT_CONTRACT}`
    case 'round2':
      return `${ROUND2_FOCUS}\n\n${INTERVIEW_OUTPUT_CONTRACT}`
    case 'hr':
      return `${HR_FOCUS}\n\n${INTERVIEW_OUTPUT_CONTRACT}`
    case 'custom': {
      const userBody = getEffectivePrompt('interviewCustom').trim()
      return `${userBody}\n\n${INTERVIEW_OUTPUT_CONTRACT}`
    }
    default:
      return getInterviewStageSystemPrompt('round1')
  }
}

/**
 * 供「面经发散」模式的 user 消息第二节：仅阶段侧重正文，不含 JSON 输出约定。
 * @param {InterviewStageId} stageId
 * @param {string} [customDraft] - custom 阶段时工作台正在编辑的文案
 * @returns {string}
 */
export function getInterviewStageFocusForUserContext(stageId, customDraft) {
  const draft =
    typeof customDraft === 'string' ? customDraft.trim() : ''
  switch (stageId) {
    case 'round1':
      return ROUND1_FOCUS
    case 'round2':
      return ROUND2_FOCUS
    case 'hr':
      return HR_FOCUS
    case 'custom':
      return draft || getEffectivePrompt('interviewCustom').trim()
    default:
      return ROUND1_FOCUS
  }
}
