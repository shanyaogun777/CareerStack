/**
 * 本地 AI 配置（OpenAI 兼容接口，支持 DeepSeek 等）。
 */

const LS_KEY_API = 'careerstack_ai_api_key'
const LS_KEY_BASE = 'careerstack_ai_base_url'
const LS_KEY_MODEL = 'careerstack_ai_model'

const DEFAULT_BASE = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

import { hashStructuredJD } from './db.js'
import { getEffectivePrompt } from './aiPrompts.js'

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

/** @type {Record<string, '基础能力'|'项目深挖'|'行为面试'>} */
const EXTRACT_CATEGORY_MAP = {
  技术: '基础能力',
  项目: '项目深挖',
  BQ: '行为面试',
}

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
    system: getEffectivePrompt('jobMatch'),
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
    system: getEffectivePrompt('resumePolish'),
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
    system: getEffectivePrompt('interviewQuestions'),
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
    system: getEffectivePrompt('extractInterview'),
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

/**
 * 基于 JD + 简历生成 3 道模拟题（AI_MOCK），用于面试工作台。
 * @param {import('./db.js').StructuredJD | null} structuredJD
 * @param {import('./db.js').Experience[]} experiences
 * @param {{ systemPrompt?: string }} [options] - 传入 `systemPrompt` 时覆盖默认「三道题」系统提示（分阶段模拟）
 * @returns {Promise<import('./db.js').InterviewQuestionItem[]>}
 */
export async function generateThreeTargetedInterviewQuestions(
  structuredJD,
  experiences,
  options = {},
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

  const system =
    typeof options.systemPrompt === 'string' && options.systemPrompt.trim()
      ? options.systemPrompt.trim()
      : getEffectivePrompt('threeQuestions')

  const text = await chatCompletionText({
    system,
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
    system: getEffectivePrompt('interviewAnswerPolish'),
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
          { role: 'system', content: getEffectivePrompt('jdParse') },
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
