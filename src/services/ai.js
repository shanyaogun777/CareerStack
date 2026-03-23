/**
 * 本地 AI 配置（OpenAI 兼容接口，支持 DeepSeek 等）。
 */

const LS_KEY_API = 'careerstack_ai_api_key'
const LS_KEY_BASE = 'careerstack_ai_base_url'
const LS_KEY_MODEL = 'careerstack_ai_model'

const DEFAULT_BASE = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

import { hashStructuredJD } from './db.js'

/**
 * Vite 注入的环境变量（可选）。注意：以 VITE_ 开头的变量会打进前端包，仅适合团队内部构建或私有部署。
 * @param {string} key
 * @returns {string}
 */
function readEnv(key) {
  try {
    const v = import.meta.env[key]
    return typeof v === 'string' ? v.trim() : ''
  } catch {
    return ''
  }
}

const PARSE_TIMEOUT_MS = 90_000
const CHAT_TIMEOUT_MS = 120_000

/**
 * @typedef {Object} AiSettings
 * @property {string} apiKey
 * @property {string} baseUrl
 * @property {string} model
 */

/**
 * @returns {AiSettings}
 */
export function loadAiSettings() {
  const storedKey = localStorage.getItem(LS_KEY_API)
  const storedBase = localStorage.getItem(LS_KEY_BASE)
  const storedModel = localStorage.getItem(LS_KEY_MODEL)

  const apiKey =
    storedKey !== null ? storedKey : readEnv('VITE_DEEPSEEK_API_KEY')

  let baseUrl = DEFAULT_BASE
  if (storedBase !== null) {
    baseUrl = storedBase.trim() || DEFAULT_BASE
  } else {
    const fromEnv = readEnv('VITE_AI_BASE_URL')
    if (fromEnv) baseUrl = fromEnv
  }

  let model = DEFAULT_MODEL
  if (storedModel !== null) {
    model = storedModel.trim() || DEFAULT_MODEL
  } else {
    const fromEnv = readEnv('VITE_AI_MODEL')
    if (fromEnv) model = fromEnv
  }

  return { apiKey, baseUrl, model }
}

/**
 * @param {Partial<AiSettings>} patch
 */
export function saveAiSettings(patch) {
  if (patch.apiKey !== undefined) {
    if (patch.apiKey) localStorage.setItem(LS_KEY_API, patch.apiKey)
    else localStorage.removeItem(LS_KEY_API)
  }
  if (patch.baseUrl !== undefined) {
    const v = patch.baseUrl.trim()
    if (v) localStorage.setItem(LS_KEY_BASE, v)
    else localStorage.removeItem(LS_KEY_BASE)
  }
  if (patch.model !== undefined) {
    const v = patch.model.trim()
    if (v) localStorage.setItem(LS_KEY_MODEL, v)
    else localStorage.removeItem(LS_KEY_MODEL)
  }
}

/**
 * @returns {boolean}
 */
export function hasAiApiKey() {
  return Boolean(loadAiSettings().apiKey.trim())
}

const JD_PARSE_SYSTEM = `你是招聘文本分析助手。用户会粘贴一份职位描述（可能含广告、培训推销、无关宣传）。
请：
1. 剔除无效信息（培训广告、与岗位无关的宣传、诱导加群/外链等）。
2. 只输出一个 JSON 对象，不要 markdown 代码围栏，不要任何解释文字。
3. JSON 键名必须完全一致（使用下列中文键名）：
   - "核心职责": 字符串，多条用 \\n 换行
   - "任职要求": 字符串
   - "关键技能点": 字符串数组，每项为独立技能或工具名
   - "加分项": 字符串；若无则写 ""`

/**
 * @param {string} text
 * @returns {string}
 */
function stripJsonFence(text) {
  let t = text.trim()
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/u, '')
  }
  return t.trim()
}

/**
 * @param {{ system: string; user: string; temperature?: number; timeoutMs?: number }} opts
 * @returns {Promise<string>}
 */
async function chatCompletionText(opts) {
  const { apiKey, baseUrl, model } = loadAiSettings()
  if (!apiKey.trim()) {
    throw new Error('请先在侧栏「设置」中配置 API Key')
  }
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? CHAT_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        temperature: opts.temperature ?? 0.3,
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.user },
        ],
      }),
    })
    const rawText = await res.text()
    let data
    try {
      data = JSON.parse(rawText)
    } catch {
      throw new Error(
        res.ok
          ? '接口返回非 JSON'
          : `请求失败（${res.status}）：${rawText.slice(0, 200)}`,
      )
    }
    if (!res.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `HTTP ${res.status}：${rawText.slice(0, 160)}`
      throw new Error(msg)
    }
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('模型未返回有效内容')
    }
    return content.trim()
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        throw new Error('请求超时，请检查网络或稍后再试')
      }
      if (e.message === 'Failed to fetch') {
        throw new Error('网络错误：无法连接 API')
      }
      throw e
    }
    throw new Error(String(e))
  } finally {
    clearTimeout(timer)
  }
}

const MATCH_SYSTEM = `你是资深招聘顾问。根据「岗位结构化 JD」与候选人「已选个人信息库素材」摘要，评估匹配度。
只输出一个 JSON 对象，不要 markdown 围栏，不要其他文字。
键名必须完全一致：
- "score": 整数 0-100
- "strengths": 字符串数组，候选人相对该岗的优势（简短要点）
- "gaps": 字符串数组，相对 JD 仍缺失或可加强的技能/经历维度
- "suggestions": 字符串数组，可执行的改进建议（简短）
- "keywords": 字符串数组，从 JD 与素材中提炼的匹配关键词（5-12 个）`

const INTERVIEW_SYSTEM = `你是面试官助手。根据岗位结构化 JD 与用户简历素材摘要，生成面试题。
只输出一个 JSON 数组（不要对象包裹），不要 markdown 围栏。
数组中每项对象键名必须一致：
- "category": 只能是 "基础能力"、"项目深挖"、"行为面试" 之一
- "question": 面试问题全文
- "answerHint": 参考回答思路（要点式，非背诵稿）
请覆盖三类：至少各 2 题；与 JD 硬性技能、用户项目细节、软素质/文化相关。`

const EXTRACT_INTERVIEW_SYSTEM = `你是面试题提取助手。用户会粘贴来自牛客、小红书等平台的非结构化面经全文（顺序混乱、含水贴）。
任务：
1. 只提取「面试官实际问过的具体问题」，每条一句，表述简练。
2. 过滤无关内容：如「楼主好运」「接 offer」「顶」「赞」「同问」、纯表情、与面试无关的广告、纯时间戳、作者自我介绍段落（除非本身是面试问答）。
3. 为每题标注类别：技术（算法/语言/计算机基础/工具）、项目（实习/项目/科研）、BQ（行为/动机/团队/压力/冲突）。
只输出一个 JSON 数组，不要 markdown 代码围栏，不要任何解释。
数组中每项对象键名必须一致：
- "category": 只能是 "技术"、"项目"、"BQ" 之一
- "question": 问题全文（不要编号前缀如「1.」除非编号是问题本身的一部分）`

/** @type {Record<string, '基础能力'|'项目深挖'|'行为面试'>} */
const EXTRACT_CATEGORY_MAP = {
  技术: '基础能力',
  项目: '项目深挖',
  BQ: '行为面试',
}

const POLISH_SYSTEM = `你是中文简历顾问。根据目标岗位 JD，将用户提供的经历描述用 STAR（情境、任务、行动、结果）逻辑重写。
要求：
1. 保留 Markdown 语法结构（标题、列表、加粗、行内代码等可保留；不要引入 HTML）。
2. 用词向 JD 中的技术栈与高频术语靠拢（合理映射，不虚构未出现的经历事实）。
3. 输出中只包含改写后的 Markdown 正文，不要前言后语。
4. 若原文为空，输出空字符串。`

/**
 * @param {import('./db.js').StructuredJD | null} structuredJD
 * @param {import('./db.js').Experience[]} experiences
 * @returns {Promise<import('./db.js').MatchAnalysisCache>}
 */
export async function analyzeJobMatch(structuredJD, experiences) {
  const jdText = JSON.stringify(structuredJD ?? {}, null, 0).slice(0, 12_000)
  const expBrief = experiences
    .map(
      (e) =>
        `[#${e.id}] ${e.company} | ${e.role} | ${e.type}\n标签:${(e.tags || []).join(',')}\n${(e.description || '').slice(0, 1_200)}`,
    )
    .join('\n---\n')
    .slice(0, 24_000)

  const user = `【岗位 JD JSON】\n${jdText}\n\n【候选人素材摘要】\n${expBrief || '（无）'}`

  const text = await chatCompletionText({
    system: MATCH_SYSTEM,
    user,
    temperature: 0.2,
  })
  let parsed
  try {
    parsed = JSON.parse(stripJsonFence(text))
  } catch {
    throw new Error('匹配分析返回格式异常，请重试')
  }
  const score = Math.min(100, Math.max(0, Number(parsed.score) || 0))
  return {
    score,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
    suggestions: Array.isArray(parsed.suggestions)
      ? parsed.suggestions.map(String)
      : [],
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
    experienceIds: experiences.map((e) => e.id),
    structuredJDHash: hashStructuredJD(
      /** @type {import('./db.js').StructuredJD | null} */ (structuredJD),
    ),
    updatedAt: Date.now(),
  }
}

/**
 * @param {{
 *   markdown: string
 *   structuredJD: import('./db.js').StructuredJD | null
 *   jobTitle: string
 *   company: string
 * }} ctx
 * @returns {Promise<string>}
 */
export async function polishResumeExperienceMarkdown(ctx) {
  const jd = JSON.stringify(ctx.structuredJD ?? {}, null, 0).slice(0, 10_000)
  const user = `目标公司：${ctx.company || '—'}\n目标职位：${ctx.jobTitle || '—'}\n【JD 摘要 JSON】\n${jd}\n\n【待润色经历 Markdown】\n${ctx.markdown.slice(0, 12_000)}`

  const text = await chatCompletionText({
    system: POLISH_SYSTEM,
    user,
    temperature: 0.35,
  })
  return text
}

/**
 * @param {import('./db.js').StructuredJD | null} structuredJD
 * @param {import('./db.js').Experience[]} experiences
 * @returns {Promise<import('./db.js').InterviewQuestionItem[]>}
 */
export async function generateInterviewQuestions(structuredJD, experiences) {
  const jdText = JSON.stringify(structuredJD ?? {}, null, 0).slice(0, 10_000)
  const expBrief = experiences
    .map(
      (e) =>
        `[#${e.id}] ${e.company} · ${e.role}\n${(e.description || '').slice(0, 800)}`,
    )
    .join('\n---\n')
    .slice(0, 16_000)

  const user = `【岗位 JD JSON】\n${jdText}\n\n【用户项目/经历摘要】\n${expBrief || '（无）'}`

  const text = await chatCompletionText({
    system: INTERVIEW_SYSTEM,
    user,
    temperature: 0.45,
  })
  let parsed
  try {
    parsed = JSON.parse(stripJsonFence(text))
  } catch {
    throw new Error('面试题生成返回格式异常，请重试')
  }
  if (!Array.isArray(parsed)) {
    throw new Error('面试题格式应为数组')
  }
  const cats = ['基础能力', '项目深挖', '行为面试']
  return parsed.map((item, i) => {
    const o = item && typeof item === 'object' ? item : {}
    const cat =
      typeof o.category === 'string' && cats.includes(o.category)
        ? o.category
        : '基础能力'
    const qText = String(o.question ?? '').trim()
    return {
      id: `iq-${Date.now()}-${i}`,
      category: /** @type {'基础能力'|'项目深挖'|'行为面试'} */ (cat),
      question: qText,
      answerHint: String(o.answerHint ?? ''),
      type: /** @type {'AI_MOCK'} */ ('AI_MOCK'),
      sourceUrl: '',
      content: qText,
      answerDraft: '',
      difficulty: 3,
      prepStatus: /** @type {'pending'} */ ('pending'),
    }
  })
}

/**
 * 从非结构化面经正文中抽取面试问题列表（用户采集）。
 * @param {string} rawText
 * @param {string} [defaultSourceUrl] - 可选，写入每条记录的 sourceUrl（如同一原帖）
 * @returns {Promise<import('./db.js').InterviewQuestionItem[]>}
 */
export async function extractInterviewQuestionsFromPost(
  rawText,
  defaultSourceUrl = '',
) {
  const text = rawText.trim().slice(0, 48_000)
  if (!text) {
    throw new Error('请先粘贴面经全文')
  }

  const user = `【面经原文】\n${text}`

  const completion = await chatCompletionText({
    system: EXTRACT_INTERVIEW_SYSTEM,
    user,
    temperature: 0.15,
  })
  let parsed
  try {
    parsed = JSON.parse(stripJsonFence(completion))
  } catch {
    throw new Error('面经提取返回格式异常，请重试')
  }
  if (!Array.isArray(parsed)) {
    throw new Error('面经提取结果应为数组')
  }

  const baseUrl = String(defaultSourceUrl ?? '').trim()
  const ts = Date.now()
  /** @type {import('./db.js').InterviewQuestionItem[]} */
  const out = []
  parsed.forEach((item, i) => {
    const o = item && typeof item === 'object' ? item : {}
    const rawCat = typeof o.category === 'string' ? o.category.trim() : ''
    const mapped =
      rawCat in EXTRACT_CATEGORY_MAP
        ? EXTRACT_CATEGORY_MAP[rawCat]
        : '基础能力'
    const qText = String(o.question ?? '').trim()
    if (!qText) return
    out.push({
      id: `uc-${ts}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      category: /** @type {'基础能力'|'项目深挖'|'行为面试'} */ (mapped),
      question: qText,
      content: qText,
      answerHint: '',
      type: /** @type {'USER_COLLECTED'} */ ('USER_COLLECTED'),
      sourceUrl: baseUrl,
      answerDraft: '',
      difficulty: 3,
      prepStatus: /** @type {'pending'} */ ('pending'),
    })
  })
  return out
}

const THREE_Q_SYSTEM = `你是面试官。根据岗位结构化 JD 与用户简历/项目摘要，生成**恰好 3 道**高针对性面试题。
只输出 JSON 数组，不要 markdown 围栏，不要其他文字。
数组长度必须为 3。每项键名一致：
- "category": "基础能力"|"项目深挖"|"行为面试"
- "question": 面试问题全文
- "answerHint": 要点式参考思路（非背诵稿）
三道题须角度不同，并紧扣 JD 与用户经历中的可验证细节。`

const INTERVIEW_ANSWER_POLISH_SYSTEM = `你是面试教练。根据目标岗位 JD，将用户的面试回答草稿用 STAR（情境、任务、行动、结果）扩写润色。
要求：
1. 保留 Markdown 语法（标题、列表、加粗等）；不要 HTML。
2. 不虚构用户未提及的经历或数据；可合理补充衔接句。
3. 输出中只包含润色后的 Markdown 正文，不要前言后语。
4. 若草稿为空，输出空字符串。`

/**
 * 基于 JD + 简历生成 3 道模拟题（AI_MOCK），用于面试工作台。
 * @param {import('./db.js').StructuredJD | null} structuredJD
 * @param {import('./db.js').Experience[]} experiences
 * @returns {Promise<import('./db.js').InterviewQuestionItem[]>}
 */
export async function generateThreeTargetedInterviewQuestions(
  structuredJD,
  experiences,
) {
  const jdText = JSON.stringify(structuredJD ?? {}, null, 0).slice(0, 10_000)
  const expBrief = experiences
    .map(
      (e) =>
        `[#${e.id}] ${e.company} · ${e.role}\n${(e.description || '').slice(0, 900)}`,
    )
    .join('\n---\n')
    .slice(0, 16_000)

  const user = `【岗位 JD JSON】\n${jdText}\n\n【用户项目/经历摘要】\n${expBrief || '（无）'}`

  const text = await chatCompletionText({
    system: THREE_Q_SYSTEM,
    user,
    temperature: 0.4,
  })
  let parsed
  try {
    parsed = JSON.parse(stripJsonFence(text))
  } catch {
    throw new Error('模拟题生成返回格式异常，请重试')
  }
  if (!Array.isArray(parsed)) {
    throw new Error('模拟题格式应为数组')
  }
  const cats = ['基础能力', '项目深挖', '行为面试']
  const slice = parsed.slice(0, 3)
  while (slice.length < 3) {
    slice.push({ category: '基础能力', question: '', answerHint: '' })
  }
  const ts = Date.now()
  return slice.slice(0, 3).map((item, i) => {
    const o = item && typeof item === 'object' ? item : {}
    const cat =
      typeof o.category === 'string' && cats.includes(o.category)
        ? o.category
        : '基础能力'
    const qText = String(o.question ?? '').trim() || `（请补充第 ${i + 1} 题）`
    return {
      id: `iq-${ts}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      category: /** @type {'基础能力'|'项目深挖'|'行为面试'} */ (cat),
      question: qText,
      answerHint: String(o.answerHint ?? ''),
      type: /** @type {'AI_MOCK'} */ ('AI_MOCK'),
      sourceUrl: '',
      content: qText,
      answerDraft: '',
      difficulty: 3,
      prepStatus: /** @type {'pending'} */ ('pending'),
    }
  })
}

/**
 * 使用 STAR 扩写面试回答草稿（Markdown）。
 * @param {{
 *   draftMarkdown: string
 *   structuredJD: import('./db.js').StructuredJD | null
 *   jobTitle: string
 *   company: string
 * }} ctx
 * @returns {Promise<string>}
 */
export async function polishInterviewAnswerSTAR(ctx) {
  const jd = JSON.stringify(ctx.structuredJD ?? {}, null, 0).slice(0, 10_000)
  const user = `目标公司：${ctx.company || '—'}\n目标职位：${ctx.jobTitle || '—'}\n【JD 摘要 JSON】\n${jd}\n\n【用户回答草稿 Markdown】\n${ctx.draftMarkdown.slice(0, 14_000)}`

  return chatCompletionText({
    system: INTERVIEW_ANSWER_POLISH_SYSTEM,
    user,
    temperature: 0.35,
  })
}

/**
 * 调用 OpenAI 兼容 Chat Completions，将原始 JD 解析为结构化 JSON。
 * @param {string} rawJD
 * @returns {Promise<import('./db.js').StructuredJD>}
 */
export async function parseJobDescription(rawJD) {
  const { apiKey, baseUrl, model } = loadAiSettings()
  if (!apiKey.trim()) {
    throw new Error('请先在侧栏「设置」中配置 API Key')
  }

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PARSE_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: JD_PARSE_SYSTEM },
          {
            role: 'user',
            content: `请解析以下职位描述：\n\n${rawJD.slice(0, 48_000)}`,
          },
        ],
      }),
    })

    const rawText = await res.text()
    let data
    try {
      data = JSON.parse(rawText)
    } catch {
      throw new Error(
        res.ok
          ? '接口返回非 JSON'
          : `请求失败（${res.status}）：${rawText.slice(0, 200)}`,
      )
    }

    if (!res.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `HTTP ${res.status}：${rawText.slice(0, 160)}`
      throw new Error(msg)
    }

    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('模型未返回有效内容')
    }

    let parsed
    try {
      parsed = JSON.parse(stripJsonFence(content))
    } catch {
      throw new Error('模型返回的不是合法 JSON，请重试或精简 JD 文本')
    }

    return /** @type {import('./db.js').StructuredJD} */ (parsed)
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        throw new Error('请求超时，请检查网络或稍后再试')
      }
      if (e.message === 'Failed to fetch') {
        throw new Error('网络错误：无法连接 API，请检查 Base URL 与网络')
      }
      throw e
    }
    throw new Error(String(e))
  } finally {
    clearTimeout(timer)
  }
}
