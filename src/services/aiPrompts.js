/**
 * 用户可自定义的 AI 系统提示词（默认内置 + localStorage 持久化）。
 * 云端同步：可与全量备份一并导出/导入；不单独写 Supabase 表以降低复杂度。
 */

const LS_KEY = 'careerstack_ai_prompts_v1'

/** @typedef {'jdParse'|'jobMatch'|'interviewQuestions'|'extractInterview'|'resumePolish'|'threeQuestions'|'interviewAnswerPolish'} AiPromptId */

/** @type {Record<AiPromptId, string>} */
export const AI_PROMPT_DEFAULTS = {
  jdParse: `你是招聘文本分析助手。用户会粘贴一份职位描述（可能含广告、培训推销、无关宣传）。
请：
1. 剔除无效信息（培训广告、与岗位无关的宣传、诱导加群/外链等）。
2. 只输出一个 JSON 对象，不要 markdown 代码围栏，不要任何解释文字。
3. JSON 键名必须完全一致（使用下列中文键名）：
   - "核心职责": 字符串，多条用 \\n 换行
   - "任职要求": 字符串
   - "关键技能点": 字符串数组，每项为独立技能或工具名
   - "加分项": 字符串；若无则写 ""`,

  jobMatch: `你是资深招聘顾问。根据「岗位结构化 JD」与候选人「已选个人信息库素材」摘要，评估匹配度。
只输出一个 JSON 对象，不要 markdown 围栏，不要其他文字。
键名必须完全一致：
- "score": 整数 0-100
- "strengths": 字符串数组，候选人相对该岗的优势（简短要点）
- "gaps": 字符串数组，相对 JD 仍缺失或可加强的技能/经历维度
- "suggestions": 字符串数组，可执行的改进建议（简短）
- "keywords": 字符串数组，从 JD 与素材中提炼的匹配关键词（5-12 个）`,

  interviewQuestions: `你是面试官助手。根据岗位结构化 JD 与用户简历素材摘要，生成面试题。
只输出一个 JSON 数组（不要对象包裹），不要 markdown 围栏。
数组中每项对象键名必须一致：
- "category": 只能是 "基础能力"、"项目深挖"、"行为面试" 之一
- "question": 面试问题全文
- "answerHint": 参考回答思路（要点式，非背诵稿）
请覆盖三类：至少各 2 题；与 JD 硬性技能、用户项目细节、软素质/文化相关。`,

  extractInterview: `你是面试题提取助手。用户会粘贴来自牛客、小红书等平台的非结构化面经全文（顺序混乱、含水贴）。
任务：
1. 只提取「面试官实际问过的具体问题」，每条一句，表述简练。
2. 过滤无关内容：如「楼主好运」「接 offer」「顶」「赞」「同问」、纯表情、与面试无关的广告、纯时间戳、作者自我介绍段落（除非本身是面试问答）。
3. 为每题标注类别：技术（算法/语言/计算机基础/工具）、项目（实习/项目/科研）、BQ（行为/动机/团队/压力/冲突）。
只输出一个 JSON 数组，不要 markdown 代码围栏，不要任何解释。
数组中每项对象键名必须一致：
- "category": 只能是 "技术"、"项目"、"BQ" 之一
- "question": 问题全文（不要编号前缀如「1.」除非编号是问题本身的一部分）`,

  resumePolish: `你是中文简历顾问。根据目标岗位 JD，将用户提供的经历描述用 STAR（情境、任务、行动、结果）逻辑重写。
要求：
1. 保留 Markdown 语法结构（标题、列表、加粗、行内代码等可保留；不要引入 HTML）。
2. 用词向 JD 中的技术栈与高频术语靠拢（合理映射，不虚构未出现的经历事实）。
3. 输出中只包含改写后的 Markdown 正文，不要前言后语。
4. 若原文为空，输出空字符串。`,

  threeQuestions: `你是面试官。根据岗位结构化 JD 与用户简历/项目摘要，生成**恰好 3 道**高针对性面试题。
只输出 JSON 数组，不要 markdown 围栏，不要其他文字。
数组长度必须为 3。每项键名一致：
- "category": "基础能力"|"项目深挖"|"行为面试"
- "question": 面试问题全文
- "answerHint": 要点式参考思路（非背诵稿）
三道题须角度不同，并紧扣 JD 与用户经历中的可验证细节。`,

  interviewAnswerPolish: `你是面试教练。根据目标岗位 JD，将用户的面试回答草稿用 STAR（情境、任务、行动、结果）扩写润色。
要求：
1. 保留 Markdown 语法（标题、列表、加粗等）；不要 HTML。
2. 不虚构用户未提及的经历或数据；可合理补充衔接句。
3. 输出中只包含润色后的 Markdown 正文，不要前言后语。
4. 若草稿为空，输出空字符串。`,
}

/** @type {readonly AiPromptId[]} */
export const AI_PROMPT_IDS = /** @type {AiPromptId[]} */ (Object.keys(AI_PROMPT_DEFAULTS))

/** @type {Record<AiPromptId, string>} */
export const AI_PROMPT_LABELS = {
  jdParse: 'JD 结构化解析',
  jobMatch: '岗位匹配度分析',
  interviewQuestions: '面试题生成（多题）',
  extractInterview: '面经问题抽取',
  resumePolish: '简历经历 STAR 润色',
  threeQuestions: '模拟面试（3 道针对性题）',
  interviewAnswerPolish: '面试回答 STAR 润色',
}

/**
 * @returns {Partial<Record<AiPromptId, string>>}
 */
function readStoredOverrides() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    const o = JSON.parse(raw)
    if (!o || typeof o !== 'object') return {}
    return o
  } catch {
    return {}
  }
}

/**
 * @returns {Record<AiPromptId, string>}
 */
export function loadAllAiPromptsMerged() {
  const overrides = readStoredOverrides()
  /** @type {Record<AiPromptId, string>} */
  const out = { ...AI_PROMPT_DEFAULTS }
  for (const id of /** @type {AiPromptId[]} */ (Object.keys(AI_PROMPT_DEFAULTS))) {
    const v = overrides[id]
    if (typeof v === 'string' && v.trim()) {
      out[id] = v.trim()
    }
  }
  return out
}

/**
 * @param {AiPromptId} id
 * @returns {string}
 */
export function getEffectivePrompt(id) {
  const merged = loadAllAiPromptsMerged()
  return merged[id] ?? AI_PROMPT_DEFAULTS[id]
}

/**
 * @param {Partial<Record<AiPromptId, string>>} patch
 */
export function saveAiPromptOverrides(patch) {
  const current = readStoredOverrides()
  const next = { ...current }
  for (const [k, v] of Object.entries(patch)) {
    if (!Object.prototype.hasOwnProperty.call(AI_PROMPT_DEFAULTS, k)) continue
    const id = /** @type {AiPromptId} */ (k)
    if (v === undefined || v === null) {
      delete next[id]
      continue
    }
    const s = String(v).trim()
    if (!s || s === AI_PROMPT_DEFAULTS[id]) {
      delete next[id]
    } else {
      next[id] = s
    }
  }
  if (Object.keys(next).length === 0) {
    localStorage.removeItem(LS_KEY)
  } else {
    localStorage.setItem(LS_KEY, JSON.stringify(next))
  }
}

/**
 * @param {AiPromptId} id
 */
export function resetAiPromptToDefault(id) {
  saveAiPromptOverrides({ [id]: '' })
}

export function resetAllAiPromptsToDefaults() {
  localStorage.removeItem(LS_KEY)
}

/**
 * @param {AiPromptId} id
 * @returns {boolean}
 */
export function isPromptCustomized(id) {
  const o = readStoredOverrides()
  const v = o[id]
  return typeof v === 'string' && v.trim() !== '' && v.trim() !== AI_PROMPT_DEFAULTS[id]
}
