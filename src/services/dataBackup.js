/**
 * IndexedDB 全量导出 / 导入（JSON），含 Blob（附件、头像）的 Base64 序列化。
 */

import { db } from './db.js'

/** v2：增加 calendarTodos */
export const BACKUP_FORMAT_VERSION = 2

/**
 * @param {Blob} blob
 * @returns {Promise<string>} Base64（无 data URL 前缀）
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const s = String(r.result)
      const i = s.indexOf(',')
      resolve(i >= 0 ? s.slice(i + 1) : s)
    }
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

/**
 * @param {string} b64
 * @param {string} mime
 * @returns {Blob}
 */
function base64ToBlob(b64, mime) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime || 'application/octet-stream' })
}

/**
 * @param {import('./db.js').Experience} e
 */
async function serializeExperience(e) {
  const copy = structuredClone(e)
  if (!Array.isArray(copy.attachments)) return copy
  copy.attachments = await Promise.all(
    copy.attachments.map(async (a) => {
      if (!(a && typeof a === 'object')) return a
      const att = /** @type {import('./db.js').ExperienceAttachment} */ (a)
      if (!(att.blob instanceof Blob)) return att
      return {
        id: att.id,
        name: att.name,
        mimeType: att.mimeType,
        size: att.size,
        addedAt: att.addedAt,
        blobBase64: await blobToBase64(att.blob),
      }
    }),
  )
  return copy
}

/**
 * @param {unknown} raw
 */
function deserializeExperience(raw) {
  const e = structuredClone(raw)
  if (!Array.isArray(e.attachments)) return e
  e.attachments = e.attachments.map((a) => {
    if (!a || typeof a !== 'object') return a
    const o = /** @type {Record<string, unknown>} */ (a)
    if (typeof o.blobBase64 === 'string' && o.blobBase64) {
      const blob = base64ToBlob(
        o.blobBase64,
        typeof o.mimeType === 'string' ? o.mimeType : 'application/octet-stream',
      )
      return {
        id: String(o.id ?? ''),
        name: String(o.name ?? ''),
        mimeType: String(o.mimeType ?? 'application/octet-stream'),
        size: typeof o.size === 'number' ? o.size : undefined,
        addedAt: typeof o.addedAt === 'number' ? o.addedAt : undefined,
        blob,
      }
    }
    return a
  })
  return e
}

/**
 * @param {import('./db.js').Resume} r
 */
async function serializeResume(r) {
  const copy = structuredClone(r)
  const basics = copy.sections?.basics
  if (basics?.avatarBlob instanceof Blob) {
    basics.avatarBlobBase64 = await blobToBase64(basics.avatarBlob)
    delete basics.avatarBlob
  }
  return copy
}

/**
 * @param {unknown} raw
 */
function deserializeResume(raw) {
  const r = structuredClone(raw)
  const basics = r.sections?.basics
  if (
    basics &&
    typeof basics === 'object' &&
    typeof basics.avatarBlobBase64 === 'string' &&
    basics.avatarBlobBase64
  ) {
    basics.avatarBlob = base64ToBlob(
      basics.avatarBlobBase64,
      typeof basics.avatarMimeType === 'string'
        ? basics.avatarMimeType
        : 'image/png',
    )
    delete basics.avatarBlobBase64
  }
  return r
}

/**
 * @returns {Promise<string>} JSON 字符串
 */
export async function exportAllDataJson() {
  const [experiences, resumes, jobs, calendarTodos] = await Promise.all([
    db.experiences.toArray(),
    db.resumes.toArray(),
    db.jobs.toArray(),
    db.calendarTodos.toArray(),
  ])
  const expSer = await Promise.all(experiences.map((e) => serializeExperience(e)))
  const resSer = await Promise.all(resumes.map((r) => serializeResume(r)))
  const payload = {
    careerstackExport: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    experiences: expSer,
    resumes: resSer,
    jobs,
    calendarTodos,
  }
  return JSON.stringify(payload, null, 2)
}

/**
 * 触发浏览器下载 JSON 文件。
 */
export async function downloadBackupFile() {
  const json = await exportAllDataJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const d = new Date()
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  a.href = url
  a.download = `careerstack-backup-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 从 JSON 字符串恢复数据库（会清空现有 experiences / resumes / jobs）。
 * @param {string} jsonText
 */
export async function importAllDataFromJson(jsonText) {
  let data
  try {
    data = JSON.parse(jsonText)
  } catch {
    throw new Error('文件不是有效的 JSON')
  }
  const ver = data.careerstackExport
  if (ver !== 1 && ver !== 2) {
    throw new Error(`不支持的备份版本：${ver ?? '未知'}`)
  }
  if (!Array.isArray(data.experiences) || !Array.isArray(data.resumes) || !Array.isArray(data.jobs)) {
    throw new Error('备份文件结构不完整')
  }

  const calendarTodoRows = Array.isArray(data.calendarTodos) ? data.calendarTodos : []

  await db.transaction(
    'rw',
    db.experiences,
    db.resumes,
    db.jobs,
    db.calendarTodos,
    async () => {
      await db.experiences.clear()
      await db.resumes.clear()
      await db.jobs.clear()
      await db.calendarTodos.clear()

      for (const raw of data.experiences) {
        const row = deserializeExperience(raw)
        await db.experiences.put(row)
      }
      for (const raw of data.resumes) {
        const row = deserializeResume(raw)
        await db.resumes.put(row)
      }
      for (const raw of data.jobs) {
        await db.jobs.put(raw)
      }
      for (const raw of calendarTodoRows) {
        if (!raw || typeof raw !== 'object') continue
        const row = {
          dateKey: String(raw.dateKey ?? ''),
          content: String(raw.content ?? ''),
          isCompleted: Boolean(raw.isCompleted),
          jobId:
            raw.jobId != null && raw.jobId !== '' && Number.isFinite(Number(raw.jobId))
              ? Number(raw.jobId)
              : null,
          createdAt: Number(raw.createdAt) || Date.now(),
        }
        const id = Number(raw.id)
        if (Number.isFinite(id) && id > 0) {
          await db.calendarTodos.put({ ...row, id })
        } else {
          await db.calendarTodos.add(row)
        }
      }
    },
  )
}
