import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Loader2, Paperclip, Trash2, Upload, X } from 'lucide-react'
import {
  EXPERIENCE_CATEGORY_LABELS,
  EXPERIENCE_CATEGORIES,
  experienceRepository,
  normalizeExperienceCategory,
} from '../../services/db'
import { buildAttachmentsFromFiles } from '../../utils/fileAttachments'
import { MarkdownPreview } from './MarkdownPreview'

const fieldClass =
  'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200'

const labelClass = 'mb-1 block text-xs font-medium text-gray-700'

function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/**
 * @param {{
 *   open: boolean
 *   experienceId: number | null
 *   onClose: () => void
 *   onSaved: () => void
 *   initialCategory?: 'education' | 'work' | 'project' | 'campus'
 * }} props
 */
export function ExperienceFormDrawer({
  open,
  experienceId,
  onClose,
  onSaved,
  initialCategory = 'work',
}) {
  const titleId = useId()
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [attachBusy, setAttachBusy] = useState(false)
  const [fileHint, setFileHint] = useState('')

  const [category, setCategory] = useState(
    /** @type {'education' | 'work' | 'project' | 'campus'} */ ('work'),
  )
  const [type, setType] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState([])
  const prevOpenRef = useRef(false)

  const resetForm = useCallback(() => {
    setLoadError('')
    setFileHint('')
    setCategory('work')
    setType('')
    setCompany('')
    setRole('')
    setTagsRaw('')
    setStartDate('')
    setEndDate('')
    setDescription('')
    setAttachments([])
  }, [])

  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false
      return
    }

    let cancelled = false

    if (experienceId == null) {
      const justOpened = !prevOpenRef.current
      prevOpenRef.current = true
      if (justOpened) {
        resetForm()
        setCategory(normalizeExperienceCategory(initialCategory))
      }
      return
    }

    prevOpenRef.current = true

    setLoading(true)
    setLoadError('')
    ;(async () => {
      try {
        const row = await experienceRepository.getById(experienceId)
        if (cancelled) return
        if (!row) {
          setLoadError('记录不存在或已删除')
          resetForm()
          return
        }
        setCategory(normalizeExperienceCategory(row.category))
        setType(row.type ?? '')
        setCompany(row.company ?? '')
        setRole(row.role ?? '')
        setTagsRaw((row.tags || []).join(', '))
        setStartDate(row.startDate ?? '')
        setEndDate(row.endDate ?? '')
        setDescription(row.description ?? '')
        setAttachments(Array.isArray(row.attachments) ? [...row.attachments] : [])
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : '加载失败')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, experienceId, resetForm, initialCategory])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const parseTags = () =>
    tagsRaw
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)

  const handleFiles = async (e) => {
    const input = e.target
    const files = input.files
    if (!files?.length) return
    setAttachBusy(true)
    setFileHint('')
    try {
      const { attachments: next, skipped } = await buildAttachmentsFromFiles(
        files,
      )
      if (next.length) {
        setAttachments((prev) => [...prev, ...next])
      }
      if (skipped.length) {
        setFileHint(
          skipped.map((s) => `${s.name}：${s.reason}`).join('；'),
        )
      }
    } finally {
      setAttachBusy(false)
      input.value = ''
    }
  }

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        category,
        type,
        company,
        role,
        tags: parseTags(),
        startDate,
        endDate,
        description,
        attachments,
      }
      if (experienceId == null) {
        await experienceRepository.create(payload)
      } else {
        await experienceRepository.update(experienceId, payload)
      }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (experienceId == null) return
    if (
      !window.confirm(
        '确定删除该条目？附件将一并从本地库中移除，此操作不可撤销。',
      )
    ) {
      return
    }
    setSaving(true)
    try {
      await experienceRepository.remove(experienceId)
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const isEdit = experienceId != null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="关闭抽屉"
        className="absolute inset-0 bg-gray-900/35 transition-opacity"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2
              id={titleId}
              className="text-base font-semibold tracking-tight text-gray-900"
            >
              {isEdit ? '编辑条目' : '新增条目'}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              请先选择所属分类；描述支持 Markdown，下方为实时预览。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="关闭"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center gap-2 py-12 text-sm text-gray-500">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              加载中…
            </div>
          ) : loadError ? (
            <p className="py-8 text-sm text-red-600">{loadError}</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="exp-category">
                    素材分类
                  </label>
                  <select
                    id="exp-category"
                    className={fieldClass}
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        normalizeExperienceCategory(e.target.value),
                      )
                    }
                  >
                    {EXPERIENCE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {EXPERIENCE_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-gray-400">
                    决定该素材在简历中心可拖入的板块；与「经历类型」标签不同。
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="exp-company">
                    公司 / 组织 / 学校
                  </label>
                  <input
                    id="exp-company"
                    className={fieldClass}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="如：某某科技"
                    autoComplete="organization"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="exp-role">
                    职位 / 角色
                  </label>
                  <input
                    id="exp-role"
                    className={fieldClass}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="产品经理"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="exp-type">
                    经历类型
                  </label>
                  <input
                    id="exp-type"
                    className={fieldClass}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="实习、全职、开源项目…"
                    list="careerstack-exp-types"
                  />
                  <datalist id="careerstack-exp-types">
                    <option value="实习" />
                    <option value="全职" />
                    <option value="校园实践" />
                    <option value="开源项目" />
                  </datalist>
                </div>
                <div>
                  <label className={labelClass} htmlFor="exp-start">
                    开始时间
                  </label>
                  <input
                    id="exp-start"
                    type="month"
                    className={fieldClass}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="exp-end">
                    结束时间
                  </label>
                  <input
                    id="exp-end"
                    type="month"
                    className={fieldClass}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    仍在进行中可留空，保存后列表显示为「至今」。
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="exp-tags">
                    标签
                  </label>
                  <input
                    id="exp-tags"
                    className={fieldClass}
                    value={tagsRaw}
                    onChange={(e) => setTagsRaw(e.target.value)}
                    placeholder="用英文或中文逗号分隔，如 B端, 大模型, AI 产品"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="exp-desc">
                  经历描述（Markdown）
                </label>
                <textarea
                  id="exp-desc"
                  className={`${fieldClass} min-h-[200px] resize-y font-mono text-[13px] leading-relaxed`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={'支持 **加粗**、列表与嵌套：\n\n- 一级\n  - 二级\n\n1. 有序\n   1. 子项'}
                  spellCheck={false}
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
                <div className="mb-2 text-xs font-medium text-gray-700">
                  描述预览
                </div>
                <MarkdownPreview
                  markdown={description}
                  emptyHint="输入 Markdown 后将在此精确预览。"
                />
              </div>

              <div>
                <span className={labelClass}>附件（PDF / 图片）</span>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                    {attachBusy ? (
                      <Loader2
                        className="size-4 animate-spin text-gray-500"
                        aria-hidden
                      />
                    ) : (
                      <Upload className="size-4 text-gray-500" aria-hidden />
                    )}
                    <span>{attachBusy ? '处理中…' : '选择文件'}</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="application/pdf,image/*,.pdf"
                      multiple
                      disabled={attachBusy || saving}
                      onChange={handleFiles}
                    />
                  </label>
                  <span className="text-xs text-gray-400">
                    顺序读取、分批让出主线程；单文件 ≤ 32MB
                  </span>
                </div>
                {fileHint ? (
                  <p className="mt-2 text-xs text-amber-700">{fileHint}</p>
                ) : null}
                {attachments.length > 0 ? (
                  <ul className="mt-3 space-y-2" aria-label="已添加附件">
                    {attachments.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-gray-100 bg-white px-3 py-2 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Paperclip
                            className="size-4 shrink-0 text-gray-400"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          <span className="truncate text-gray-800">
                            {a.name}
                          </span>
                          <span className="shrink-0 text-xs text-gray-400">
                            {formatBytes(a.size ?? a.blob?.size ?? 0)}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(a.id)}
                          className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`移除 ${a.name}`}
                        >
                          <Trash2 className="size-4" strokeWidth={1.75} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-white px-5 py-3">
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || loading || !!loadError}
              className="mr-auto rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
            >
              删除
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || !!loadError}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            保存
          </button>
        </footer>
      </section>
    </div>
  )
}
