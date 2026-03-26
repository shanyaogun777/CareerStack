import Dexie from 'dexie'

/** @typedef {'CareerStackDB'} CareerStackDbName */

/**
 * @typedef {'education' | 'work' | 'project' | 'campus'} ExperienceCategory
 */

/**
 * 单条附件：Blob 可被 IndexedDB 结构化克隆持久化。
 * @typedef {Object} ExperienceAttachment
 * @property {string} id - 客户端生成的稳定 id（如同步/列表 key）
 * @property {string} name - 原始文件名
 * @property {string} mimeType - 如 application/pdf、image/png
 * @property {Blob} blob - 文件二进制
 * @property {number} [size] - 字节数，便于 UI 展示与校验
 * @property {number} [addedAt] - 添加时间戳
 */

/**
 * 写入/更新时的经历载荷（无自增 id）。
 * @typedef {Object} ExperiencePayload
 * @property {ExperienceCategory} category
 * @property {string} type - 经历类型：实习、全职、校园实践等
 * @property {string} company - 公司/组织
 * @property {string} role - 职位/角色
 * @property {string[]} tags - 标签组
 * @property {string} startDate - 开始时间（建议 ISO 或 YYYY-MM）
 * @property {string} [endDate] - 结束时间；进行中可空字符串
 * @property {string} description - Markdown 纯文本
 * @property {ExperienceAttachment[]} [attachments] - 附件列表
 */

/**
 * Dexie 持久化后的经历记录。
 * @typedef {ExperiencePayload & { id: number }} Experience
 */

/**
 * 布局项：固定板块或 `custom:${uuid}`。
 * @typedef {string} ResumeLayoutItem
 */

/**
 * @typedef {Object} ResumeBasics
 * @property {string} name
 * @property {string} title
 * @property {string} phone
 * @property {string} email
 * @property {string} location
 * @property {string} wechat
 * @property {string} age
 * @property {string} expectedLocation
 * @property {string} expectedPosition
 * @property {string} expectedSalary
 * @property {string} gender
 * @property {string} politicalStatus
 * @property {'square' | 'circle'} avatarShape
 * @property {number} avatarSizePx
 * @property {boolean} showEmail
 * @property {boolean} showPhone
 * @property {boolean} showWechat
 * @property {boolean} showAge
 * @property {boolean} showExpectedLocation
 * @property {boolean} showExpectedPosition
 * @property {boolean} showExpectedSalary
 * @property {boolean} showGender
 * @property {boolean} showPoliticalStatus
 * @property {boolean} showLocation
 * @property {Blob} [avatarBlob]
 * @property {string} [avatarMimeType]
 */

/**
 * 简历中的经历块（素材副本，可独立于 experiences 编辑）。
 * @typedef {Object} ResumeExperienceBlock
 * @property {string} id
 * @property {number} [sourceExperienceId]
 * @property {string} type
 * @property {string} company
 * @property {string} role
 * @property {string[]} tags
 * @property {string} startDate
 * @property {string} endDate
 * @property {string} description
 */

/**
 * @typedef {Object} ResumeSelfEval
 * @property {string} body
 */

/**
 * @typedef {Object} ResumeCustomModule
 * @property {string} id
 * @property {string} title
 * @property {string} body
 */

/**
 * @typedef {Object} ResumeSections
 * @property {ResumeBasics} basics
 * @property {ResumeExperienceBlock[]} education
 * @property {ResumeExperienceBlock[]} work
 * @property {ResumeExperienceBlock[]} projects
 * @property {ResumeExperienceBlock[]} campus
 * @property {ResumeSelfEval} selfEval
 * @property {ResumeCustomModule[]} customModules
 */

/**
 * @typedef {Object} ResumePayload
 * @property {string} title
 * @property {ResumeLayoutItem[]} layout
 * @property {ResumeSections} sections
 */

/**
 * @typedef {ResumePayload & { id: number }} Resume
 */

/**
 * AI 解析后的 JD 结构（键名与 Prompt 约定一致）。
 * @typedef {Object} StructuredJD
 * @property {string} [核心职责]
 * @property {string} [任职要求]
 * @property {string[]} [关键技能点]
 * @property {string} [加分项]
 */

/**
 * @typedef {'待投递' | '已投递' | '面试中' | '已录用' | '已拒绝'} JobStatus
 */

/**
 * 岗位匹配度分析缓存（IndexedDB）。
 * @typedef {Object} MatchAnalysisCache
 * @property {number} score - 0–100
 * @property {string[]} strengths - 优势
 * @property {string[]} gaps - 缺失技能
 * @property {string[]} suggestions - 改进建议
 * @property {string[]} keywords - 匹配关键词
 * @property {number[]} experienceIds - 参与分析的素材 id
 * @property {string} structuredJDHash - 用于判断 JD 是否变更
 * @property {number} updatedAt
 */

/**
 * @typedef {'AI_MOCK' | 'USER_COLLECTED' | 'AI_FACE_DIVERGENT'} InterviewQuestionSourceType
 */

/**
 * @typedef {'prepared' | 'pending'} InterviewPrepStatus
 */

/**
 * 题库备战维度（与 AI 返回的题型 `category`：基础能力/项目深挖/行为面试 并存）。
 * @typedef {'通用' | '业务' | '技术' | '行为'} InterviewPrepDimension
 */

/**
 * @typedef {Object} InterviewQuestionItem
 * @property {string} id
 * @property {'基础能力' | '项目深挖' | '行为面试'} category - AI / 面经解析使用的题型标签
 * @property {InterviewPrepDimension} [prepDimension] - 用户备战分类；缺省时由旧 `category` 推导
 * @property {string} question - 兼容旧数据；展示优先使用 `content`
 * @property {string} answerHint - AI 生成的参考思路
 * @property {InterviewQuestionSourceType} [type] - AI 生成 / 面经发散生成 / 用户采集（缺省视为 AI_MOCK）
 * @property {string} [sourceUrl] - 面经原帖链接
 * @property {string} [content] - 问题描述（与 question 同步时可只填其一）
 * @property {string} [answerDraft] - 用户准备的答案草稿
 * @property {number} [difficulty] - 难度 1–5
 * @property {InterviewPrepStatus} [prepStatus] - 已准备 / 待练习
 */

/**
 * 各面试阶段已纳入备战的题目 id 列表（顺序即展示顺序）。
 * @typedef {Object} InterviewStageBuckets
 * @property {string[]} round1
 * @property {string[]} round2
 * @property {string[]} hr
 * @property {string[]} custom
 */

/**
 * 写入/更新时的岗位载荷（无自增 id）。
 * @typedef {Object} JobPayload
 * @property {string} company
 * @property {string} position
 * @property {string} url
 * @property {string} rawJD
 * @property {StructuredJD | null} [structuredJD]
 * @property {JobStatus} [status]
 * @property {InterviewQuestionItem[] | null} [interviewQuestions]
 * @property {string | null} [interviewQuestionsHash] - 生成面试题时的 JD 指纹，用于缓存失效
 * @property {InterviewStageBuckets | null} [interviewStageBuckets] - 按轮次归流的题目 id
 * @property {MatchAnalysisCache | null} [matchAnalysis]
 * @property {number | null} [appliedResumeId] - 投递时使用的简历 id
 * @property {number | null} [nextInterviewAt] - 下一场面试日期（本地日 0 点的 UTC 时间戳，ms）
 */

/**
 * @typedef {JobPayload & { id: number; createdAt: number }} Job
 */

/**
 * 日历待办（指挥部面试日历）。
 * @typedef {Object} CalendarTodoPayload
 * @property {string} dateKey - 本地日 YYYY-MM-DD
 * @property {string} content
 * @property {boolean} [isCompleted]
 * @property {number | null} [jobId] - 可选关联岗位
 */

/**
 * @typedef {CalendarTodoPayload & { id: number; createdAt: number }} CalendarTodo
 */

export const DB_NAME = 'CareerStackDB'
export const DB_VERSION = 7

/** @type {ExperienceCategory[]} */
export const EXPERIENCE_CATEGORIES = ['education', 'work', 'project', 'campus']

export const EXPERIENCE_CATEGORY_LABELS = {
  education: '教育背景',
  work: '工作 / 实习经历',
  project: '项目经历',
  campus: '校园经历',
}

/**
 * @param {unknown} c
 * @returns {ExperienceCategory}
 */
export function normalizeExperienceCategory(c) {
  if (c === 'education' || c === 'work' || c === 'project' || c === 'campus') {
    return c
  }
  return 'work'
}

class CareerStackDB extends Dexie {
  /** @type {import('dexie').Table<Experience, number>} */
  experiences

  /** @type {import('dexie').Table<Resume, number>} */
  resumes

  /** @type {import('dexie').Table<Job, number>} */
  jobs

  /** @type {import('dexie').Table<CalendarTodo, number>} */
  calendarTodos

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      experiences: '++id, company, type, role, startDate, endDate',
    })
    this.version(2).stores({
      experiences: '++id, company, type, role, startDate, endDate',
      resumes: '++id, title',
    })
    this.version(3)
      .stores({
        experiences: '++id, company, type, role, startDate, endDate, category',
        resumes: '++id, title',
      })
      .upgrade(async (tx) => {
        await tx
          .table('experiences')
          .toCollection()
          .modify((e) => {
            if (e.category == null || e.category === '') {
              e.category = 'work'
            }
          })
      })
    this.version(4).stores({
      experiences: '++id, company, type, role, startDate, endDate, category',
      resumes: '++id, title',
      jobs: '++id, company, position, status, createdAt',
    })
    this.version(5).stores({
      experiences: '++id, company, type, role, startDate, endDate, category',
      resumes: '++id, title',
      jobs: '++id, company, position, status, createdAt',
    })
    this.version(6).stores({
      experiences: '++id, company, type, role, startDate, endDate, category',
      resumes: '++id, title',
      jobs: '++id, company, position, status, createdAt',
    })
    this.version(7).stores({
      experiences: '++id, company, type, role, startDate, endDate, category',
      resumes: '++id, title',
      jobs: '++id, company, position, status, createdAt',
      calendarTodos: '++id, dateKey, jobId',
    })
  }
}

/** 单例，供全应用复用 */
export const db = new CareerStackDB()

function normalizePayload(payload) {
  return {
    category: normalizeExperienceCategory(payload.category),
    type: payload.type ?? '',
    company: payload.company ?? '',
    role: payload.role ?? '',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    startDate: payload.startDate ?? '',
    endDate: payload.endDate ?? '',
    description: payload.description ?? '',
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
  }
}

/**
 * 将旧版 education 条目（school/degree…）转为通用 ResumeExperienceBlock。
 * @param {unknown[]} list
 * @returns {import('./db.js').ResumeExperienceBlock[]}
 */
function migrateLegacyEducationList(list) {
  if (!Array.isArray(list) || list.length === 0) return []
  const first = list[0]
  if (
    first &&
    typeof first === 'object' &&
    'school' in first &&
    !('company' in first)
  ) {
    return list.map((edu) => {
      const e = /** @type {{ id?: string; school?: string; degree?: string; major?: string; startDate?: string; endDate?: string; details?: string }} */ (
        edu
      )
      return {
        id:
          e.id && typeof e.id === 'string' && e.id.length > 0
            ? e.id
            : crypto.randomUUID(),
        type: '',
        company: e.school ?? '',
        role: [e.degree, e.major].filter(Boolean).join(' · ') || '',
        tags: [],
        startDate: e.startDate ?? '',
        endDate: e.endDate ?? '',
        description: e.details ?? '',
      }
    })
  }
  return /** @type {ResumeExperienceBlock[]} */ (list.slice())
}

/**
 * @returns {ResumeBasics}
 */
export function createDefaultBasics() {
  return {
    name: '',
    title: '',
    phone: '',
    email: '',
    location: '',
    wechat: '',
    age: '',
    expectedLocation: '',
    expectedPosition: '',
    expectedSalary: '',
    gender: '',
    politicalStatus: '',
    avatarShape: /** @type {'square' | 'circle'} */ ('circle'),
    avatarSizePx: 88,
    showEmail: true,
    showPhone: true,
    showWechat: true,
    showAge: true,
    showExpectedLocation: true,
    showExpectedPosition: true,
    showExpectedSalary: true,
    showGender: true,
    showPoliticalStatus: true,
    showLocation: true,
  }
}

/**
 * @returns {ResumeSections}
 */
export function createDefaultResumeSections() {
  return {
    basics: createDefaultBasics(),
    education: [],
    work: [],
    projects: [],
    campus: [],
    selfEval: { body: '' },
    customModules: [],
  }
}

/**
 * @returns {ResumeLayoutItem[]}
 */
export function createDefaultResumeLayout() {
  return ['basics', 'education', 'work', 'projects', 'campus', 'selfEval']
}

/**
 * @param {Partial<ResumeSections> | ResumeSections} [partial]
 * @returns {ResumeSections}
 */
export function mergeResumeSections(partial) {
  const base = createDefaultResumeSections()
  if (!partial || typeof partial !== 'object') return base
  const basicsIn = partial.basics && typeof partial.basics === 'object' ? partial.basics : {}
  const educationRaw = Array.isArray(partial.education)
    ? partial.education
    : base.education
  return {
    ...base,
    ...partial,
    basics: { ...base.basics, ...basicsIn },
    education: migrateLegacyEducationList(educationRaw),
    work: Array.isArray(partial.work) ? partial.work : base.work,
    projects: Array.isArray(partial.projects) ? partial.projects : base.projects,
    campus: Array.isArray(partial.campus) ? partial.campus : base.campus,
    selfEval: { ...base.selfEval, ...(partial.selfEval || {}) },
    customModules: Array.isArray(partial.customModules)
      ? partial.customModules
      : base.customModules,
  }
}

/**
 * @param {Partial<ResumePayload>} payload
 * @returns {ResumePayload}
 */
function normalizeResumePayload(payload) {
  const layout = Array.isArray(payload.layout)
    ? /** @type {ResumeLayoutItem[]} */ ([...payload.layout])
    : createDefaultResumeLayout()
  const sections = mergeResumeSections(payload.sections)
  return {
    title: payload.title?.trim() ? payload.title.trim() : '未命名简历',
    layout,
    sections,
  }
}

/**
 * 经历数据访问层：UI 与业务只依赖此对象，便于日后替换为云端 API。
 */
export const experienceRepository = {
  /** @returns {Promise<Experience[]>} */
  async getAll() {
    return db.experiences.orderBy('startDate').reverse().toArray()
  },

  /** @param {number} id @returns {Promise<Experience | undefined>} */
  async getById(id) {
    return db.experiences.get(id)
  },

  /**
   * @param {ExperiencePayload} payload
   * @returns {Promise<number>} 新主键 id
   */
  async create(payload) {
    return db.experiences.add(normalizePayload(payload))
  },

  /**
   * @param {number} id
   * @param {Partial<ExperiencePayload>} patch
   */
  async update(id, patch) {
    const next = { ...patch }
    if (next.category !== undefined) {
      next.category = normalizeExperienceCategory(next.category)
    }
    if (next.tags !== undefined && !Array.isArray(next.tags)) {
      next.tags = []
    }
    if (next.attachments !== undefined && !Array.isArray(next.attachments)) {
      next.attachments = []
    }
    return db.experiences.update(id, next)
  },

  /** @param {number} id */
  async remove(id) {
    return db.experiences.delete(id)
  },
}

/**
 * 简历数据访问层。
 */
export const resumeRepository = {
  /** @returns {Promise<Resume[]>} */
  async getAll() {
    return db.resumes.orderBy('id').toArray()
  },

  /** @param {number} id @returns {Promise<Resume | undefined>} */
  async getById(id) {
    return db.resumes.get(id)
  },

  /**
   * @param {Partial<ResumePayload>} payload
   * @returns {Promise<number>}
   */
  async create(payload) {
    const row = normalizeResumePayload(payload)
    return db.resumes.add(row)
  },

  /**
   * @param {number} id
   * @param {Partial<ResumePayload>} patch
   */
  async update(id, patch) {
    const next = { ...patch }
    if (next.sections !== undefined) {
      next.sections = mergeResumeSections(next.sections)
    }
    if (next.layout !== undefined && !Array.isArray(next.layout)) {
      next.layout = createDefaultResumeLayout()
    }
    if (next.title !== undefined) {
      next.title = String(next.title).trim() || '未命名简历'
    }
    return db.resumes.update(id, next)
  },

  /** @param {number} id */
  async remove(id) {
    return db.resumes.delete(id)
  },

  /** @returns {Promise<Resume>} */
  async getPrimaryOrCreate() {
    const first = await db.resumes.orderBy('id').first()
    if (first) return first
    const newId = await db.resumes.add(
      normalizeResumePayload({
        title: '我的简历',
        layout: createDefaultResumeLayout(),
        sections: createDefaultResumeSections(),
      }),
    )
    const row = await db.resumes.get(newId)
    if (!row) throw new Error('Failed to create resume')
    return row
  },
}

/** @type {JobStatus[]} */
export const JOB_STATUSES = [
  '待投递',
  '已投递',
  '面试中',
  '已录用',
  '已拒绝',
]

/**
 * @param {unknown} s
 * @returns {JobStatus}
 */
export function normalizeJobStatus(s) {
  if (typeof s === 'string' && /** @type {readonly string[]} */ (JOB_STATUSES).includes(s)) {
    return /** @type {JobStatus} */ (s)
  }
  return '待投递'
}

/**
 * @returns {StructuredJD}
 */
export function createEmptyStructuredJD() {
  return {
    核心职责: '',
    任职要求: '',
    关键技能点: [],
    加分项: '',
  }
}

/**
 * @param {unknown} raw
 * @returns {StructuredJD}
 */
export function normalizeStructuredJD(raw) {
  const base = createEmptyStructuredJD()
  if (!raw || typeof raw !== 'object') return base
  const o = /** @type {Record<string, unknown>} */ (raw)
  const skills = o['关键技能点']
  return {
    核心职责: typeof o['核心职责'] === 'string' ? o['核心职责'] : base.核心职责,
    任职要求: typeof o['任职要求'] === 'string' ? o['任职要求'] : base.任职要求,
    关键技能点: Array.isArray(skills)
      ? skills.map((x) => String(x).trim()).filter(Boolean)
      : typeof skills === 'string'
        ? skills
            .split(/[,，、\n]/)
            .map((x) => x.trim())
            .filter(Boolean)
        : base.关键技能点,
    加分项: typeof o['加分项'] === 'string' ? o['加分项'] : base.加分项,
  }
}

/**
 * @param {StructuredJD | null | undefined} s
 * @returns {string}
 */
export function hashStructuredJD(s) {
  try {
    return JSON.stringify(s ?? null)
  } catch {
    return ''
  }
}

/** @type {import('./db.js').InterviewPrepDimension[]} */
export const INTERVIEW_PREP_DIMENSIONS = ['通用', '业务', '技术', '行为']

/**
 * 由旧版题型标签推导默认备战维度（无 `prepDimension` 的旧数据）。
 * @param {'基础能力' | '项目深挖' | '行为面试'} legacyCategory
 * @returns {import('./db.js').InterviewPrepDimension}
 */
export function defaultPrepDimensionFromLegacyCategory(legacyCategory) {
  if (legacyCategory === '行为面试') return '行为'
  if (legacyCategory === '项目深挖') return '技术'
  return '通用'
}

/**
 * @param {unknown} raw
 * @returns {import('./db.js').InterviewStageBuckets}
 */
export function normalizeInterviewStageBuckets(raw) {
  /** @type {import('./db.js').InterviewStageBuckets} */
  const base = { round1: [], round2: [], hr: [], custom: [] }
  if (!raw || typeof raw !== 'object') return base
  const o = /** @type {Record<string, unknown>} */ (raw)
  for (const key of /** @type {const} */ (['round1', 'round2', 'hr', 'custom'])) {
    const arr = o[key]
    if (Array.isArray(arr)) {
      base[key] = arr
        .map((id) => String(id ?? '').trim())
        .filter(Boolean)
    }
  }
  return base
}

/**
 * 归一化面试题与阶段归流，并剔除已删除题目在 buckets 中的残留 id。
 * @param {import('./db.js').Job | null | undefined} job
 * @returns {import('./db.js').Job | null | undefined}
 */
export function enrichJobForInterviewWorkspace(job) {
  if (job == null) return job
  const questions = normalizeInterviewQuestions(job.interviewQuestions) ?? []
  const idSet = new Set(questions.map((q) => q.id))
  const buckets = normalizeInterviewStageBuckets(job.interviewStageBuckets)
  /** @type {import('./db.js').InterviewStageBuckets} */
  const pruned = {
    round1: buckets.round1.filter((id) => idSet.has(id)),
    round2: buckets.round2.filter((id) => idSet.has(id)),
    hr: buckets.hr.filter((id) => idSet.has(id)),
    custom: buckets.custom.filter((id) => idSet.has(id)),
  }
  return { ...job, interviewQuestions: questions, interviewStageBuckets: pruned }
}

/**
 * @param {unknown} raw
 * @returns {import('./db.js').InterviewQuestionItem[] | null}
 */
function normalizeInterviewQuestions(raw) {
  if (raw == null) return null
  if (!Array.isArray(raw)) return null
  const cats = /** @type {const} */ ([
    '基础能力',
    '项目深挖',
    '行为面试',
  ])
  return raw.map((item, i) => {
    const o = /** @type {Record<string, unknown>} */ (
      item && typeof item === 'object' ? item : {}
    )
    const cat = typeof o.category === 'string' && cats.includes(o.category) ? o.category : '基础能力'
    const prepDims = /** @type {const} */ (['通用', '业务', '技术', '行为'])
    const rawPrep = o.prepDimension
    const prepDimension =
      typeof rawPrep === 'string' && prepDims.includes(rawPrep)
        ? /** @type {import('./db.js').InterviewPrepDimension} */ (rawPrep)
        : defaultPrepDimensionFromLegacyCategory(
            /** @type {'基础能力'|'项目深挖'|'行为面试'} */ (cat),
          )
    const question = String(o.question ?? '')
    const contentRaw = String(o.content ?? '').trim()
    const content = contentRaw || question
    const type =
      o.type === 'USER_COLLECTED'
        ? 'USER_COLLECTED'
        : o.type === 'AI_FACE_DIVERGENT'
          ? 'AI_FACE_DIVERGENT'
          : 'AI_MOCK'
    const prepStatus =
      o.prepStatus === 'prepared' || o.prepStatus === 'pending'
        ? o.prepStatus
        : 'pending'
    let difficulty = Number(o.difficulty)
    if (!Number.isFinite(difficulty)) difficulty = 3
    difficulty = Math.min(5, Math.max(1, Math.round(difficulty)))
    return {
      id: typeof o.id === 'string' && o.id ? o.id : `iq-${i}-${Date.now()}`,
      category: /** @type {'基础能力'|'项目深挖'|'行为面试'} */ (cat),
      prepDimension,
      question: content,
      answerHint: String(o.answerHint ?? ''),
      type: /** @type {'AI_MOCK'|'USER_COLLECTED'|'AI_FACE_DIVERGENT'} */ (type),
      sourceUrl: String(o.sourceUrl ?? '').trim(),
      content,
      answerDraft: String(o.answerDraft ?? ''),
      difficulty,
      prepStatus: /** @type {'prepared'|'pending'} */ (prepStatus),
    }
  })
}

/**
 * @param {unknown} raw
 * @returns {import('./db.js').MatchAnalysisCache | null}
 */
function normalizeMatchAnalysis(raw) {
  if (raw == null || typeof raw !== 'object') return null
  const o = /** @type {Record<string, unknown>} */ (raw)
  const score = Math.min(100, Math.max(0, Number(o.score) || 0))
  return {
    score,
    strengths: Array.isArray(o.strengths) ? o.strengths.map((x) => String(x)) : [],
    gaps: Array.isArray(o.gaps) ? o.gaps.map((x) => String(x)) : [],
    suggestions: Array.isArray(o.suggestions)
      ? o.suggestions.map((x) => String(x))
      : [],
    keywords: Array.isArray(o.keywords) ? o.keywords.map((x) => String(x)) : [],
    experienceIds: Array.isArray(o.experienceIds)
      ? o.experienceIds.map((x) => Number(x)).filter((n) => Number.isFinite(n))
      : [],
    structuredJDHash: String(o.structuredJDHash ?? ''),
    updatedAt: Number(o.updatedAt) || Date.now(),
  }
}

/**
 * @param {Partial<JobPayload>} payload
 * @returns {JobPayload}
 */
function normalizeJobPayload(payload) {
  let appliedResumeId = null
  if (
    payload.appliedResumeId != null &&
    payload.appliedResumeId !== '' &&
    Number.isFinite(Number(payload.appliedResumeId))
  ) {
    appliedResumeId = Number(payload.appliedResumeId)
  }
  let nextInterviewAt = null
  if (
    payload.nextInterviewAt != null &&
    payload.nextInterviewAt !== '' &&
    Number.isFinite(Number(payload.nextInterviewAt))
  ) {
    nextInterviewAt = Number(payload.nextInterviewAt)
  }
  return {
    company: String(payload.company ?? '').trim(),
    position: String(payload.position ?? '').trim(),
    url: String(payload.url ?? '').trim(),
    rawJD: String(payload.rawJD ?? ''),
    structuredJD:
      payload.structuredJD === null || payload.structuredJD === undefined
        ? null
        : normalizeStructuredJD(payload.structuredJD),
    status: normalizeJobStatus(payload.status),
    interviewQuestions: normalizeInterviewQuestions(payload.interviewQuestions),
    interviewQuestionsHash:
      payload.interviewQuestionsHash == null || payload.interviewQuestionsHash === ''
        ? null
        : String(payload.interviewQuestionsHash),
    interviewStageBuckets: normalizeInterviewStageBuckets(payload.interviewStageBuckets),
    matchAnalysis: normalizeMatchAnalysis(payload.matchAnalysis),
    appliedResumeId,
    nextInterviewAt,
  }
}

/**
 * @param {Partial<CalendarTodoPayload>} payload
 * @returns {Omit<CalendarTodoPayload, 'isCompleted'> & { isCompleted: boolean }}
 */
function normalizeCalendarTodoPayload(payload) {
  let jobId = null
  if (
    payload.jobId != null &&
    payload.jobId !== '' &&
    Number.isFinite(Number(payload.jobId))
  ) {
    jobId = Number(payload.jobId)
  }
  return {
    dateKey: String(payload.dateKey ?? '').trim(),
    content: String(payload.content ?? '').trim(),
    isCompleted: Boolean(payload.isCompleted),
    jobId,
  }
}

/**
 * 日历待办（IndexedDB）。
 */
export const calendarTodoRepository = {
  /** @returns {Promise<CalendarTodo[]>} */
  async getAll() {
    return db.calendarTodos.orderBy('id').toArray()
  },

  /** @param {string} dateKey */
  async getByDateKey(dateKey) {
    return db.calendarTodos.where('dateKey').equals(dateKey).sortBy('id')
  },

  /**
   * @param {Partial<CalendarTodoPayload>} payload
   * @returns {Promise<number>}
   */
  async create(payload) {
    const row = normalizeCalendarTodoPayload(payload)
    if (!row.dateKey) throw new Error('dateKey 必填')
    return db.calendarTodos.add({
      ...row,
      createdAt: Date.now(),
    })
  },

  /**
   * @param {number} id
   * @param {Partial<CalendarTodoPayload>} patch
   */
  async update(id, patch) {
    const next = { ...patch }
    if (patch.isCompleted !== undefined) {
      next.isCompleted = Boolean(patch.isCompleted)
    }
    if (patch.content !== undefined) {
      next.content = String(patch.content).trim()
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'jobId')) {
      if (patch.jobId == null || patch.jobId === '') {
        next.jobId = null
      } else {
        const n = Number(patch.jobId)
        next.jobId = Number.isFinite(n) ? n : null
      }
    }
    return db.calendarTodos.update(id, next)
  },

  /** @param {number} id */
  async remove(id) {
    return db.calendarTodos.delete(id)
  },
}

/**
 * 岗位数据访问层。
 */
export const jobRepository = {
  /** @returns {Promise<Job[]>} */
  async getAll() {
    return db.jobs.orderBy('createdAt').reverse().toArray()
  },

  /** @param {number} id @returns {Promise<Job | undefined>} */
  async getById(id) {
    return db.jobs.get(id)
  },

  /**
   * @param {Partial<JobPayload>} payload
   * @returns {Promise<number>}
   */
  async create(payload) {
    const row = normalizeJobPayload(payload)
    return db.jobs.add({
      ...row,
      interviewQuestions: row.interviewQuestions ?? null,
      interviewQuestionsHash: row.interviewQuestionsHash ?? null,
      interviewStageBuckets: row.interviewStageBuckets,
      matchAnalysis: row.matchAnalysis ?? null,
      appliedResumeId: row.appliedResumeId ?? null,
      nextInterviewAt: row.nextInterviewAt ?? null,
      createdAt: Date.now(),
    })
  },

  /**
   * @param {number} id
   * @param {Partial<JobPayload>} patch
   */
  async update(id, patch) {
    const next = { ...patch }
    if (next.status !== undefined) {
      next.status = normalizeJobStatus(next.status)
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'structuredJD')) {
      if (patch.structuredJD === null) {
        next.structuredJD = null
      } else if (patch.structuredJD !== undefined) {
        next.structuredJD = normalizeStructuredJD(patch.structuredJD)
      }
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'interviewQuestions')) {
      next.interviewQuestions = normalizeInterviewQuestions(patch.interviewQuestions)
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'interviewStageBuckets')) {
      next.interviewStageBuckets = normalizeInterviewStageBuckets(
        patch.interviewStageBuckets,
      )
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'matchAnalysis')) {
      next.matchAnalysis = normalizeMatchAnalysis(patch.matchAnalysis)
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'interviewQuestionsHash')) {
      next.interviewQuestionsHash =
        patch.interviewQuestionsHash == null || patch.interviewQuestionsHash === ''
          ? null
          : String(patch.interviewQuestionsHash)
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'appliedResumeId')) {
      if (patch.appliedResumeId == null || patch.appliedResumeId === '') {
        next.appliedResumeId = null
      } else {
        const n = Number(patch.appliedResumeId)
        next.appliedResumeId = Number.isFinite(n) ? n : null
      }
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'nextInterviewAt')) {
      if (patch.nextInterviewAt == null || patch.nextInterviewAt === '') {
        next.nextInterviewAt = null
      } else {
        const n = Number(patch.nextInterviewAt)
        next.nextInterviewAt = Number.isFinite(n) ? n : null
      }
    }
    return db.jobs.update(id, next)
  },

  /** @param {number} id */
  async remove(id) {
    return db.jobs.delete(id)
  },
}
