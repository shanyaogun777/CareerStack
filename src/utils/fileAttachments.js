/** 单文件上限，避免一次性占满主线程与内存 */
export const MAX_ATTACHMENT_BYTES = 32 * 1024 * 1024

function yieldToBrowser() {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => requestAnimationFrame(resolve), { timeout: 200 })
    } else {
      requestAnimationFrame(resolve)
    }
  })
}

function isAllowedFile(file) {
  const t = (file.type || '').toLowerCase()
  const n = file.name.toLowerCase()
  if (t.startsWith('image/')) return true
  if (t === 'application/pdf' || n.endsWith('.pdf')) return true
  return false
}

/**
 * 将用户选择的文件转为可写入 Dexie 的附件结构；顺序处理并在步骤间让出主线程。
 * @param {FileList | File[]} fileList
 * @returns {Promise<{ attachments: import('../services/db.js').ExperienceAttachment[]; skipped: { name: string; reason: string }[] }>}
 */
export async function buildAttachmentsFromFiles(fileList) {
  const files = Array.from(fileList)
  const attachments = []
  const skipped = []

  for (const file of files) {
    await yieldToBrowser()

    if (!isAllowedFile(file)) {
      skipped.push({ name: file.name, reason: '仅支持 PDF 与图片' })
      continue
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      skipped.push({
        name: file.name,
        reason: `超过 ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)}MB 上限`,
      })
      continue
    }

    const buffer = await file.arrayBuffer()
    await yieldToBrowser()

    const mime =
      file.type && file.type.length > 0
        ? file.type
        : 'application/octet-stream'
    const blob = new Blob([buffer], { type: mime })

    attachments.push({
      id: crypto.randomUUID(),
      name: file.name,
      mimeType: blob.type,
      blob,
      size: blob.size,
      addedAt: Date.now(),
    })
  }

  return { attachments, skipped }
}
