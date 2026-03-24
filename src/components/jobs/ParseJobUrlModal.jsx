import { useId, useState } from 'react'
import { Loader2, Link2, Sparkles, X } from 'lucide-react'
import { fetchPageTextViaProxy } from '../../services/urlImporter'
import { hasAiApiKey, parseJobDescription } from '../../services/ai'

const fieldClass =
  'w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100'

/**
 * @param {{
 *   open: boolean
 *   onClose: () => void
 *   onApply: (payload: {
 *     rawJD: string
 *     url: string
 *     structuredJD?: import('../../services/db.js').StructuredJD
 *   }) => void
 * }} props
 */
export function ParseJobUrlModal({ open, onClose, onApply }) {
  const titleId = useId()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')

  if (!open) return null

  const handleFetch = async () => {
    setError('')
    setLoading(true)
    setPreview('')
    try {
      const text = await fetchPageTextViaProxy(url)
      setPreview(text.slice(0, 4000))
    } catch (e) {
      setError(e instanceof Error ? e.message : '拉取失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAiParse = async () => {
    const text = preview.trim()
    if (!text) {
      setError('请先拉取页面或粘贴正文')
      return
    }
    if (!hasAiApiKey()) {
      setError('请先在侧栏「设置」中配置 API Key')
      return
    }
    setError('')
    setParsing(true)
    try {
      const structured = await parseJobDescription(text)
      onApply({ rawJD: text, url: url.trim(), structuredJD: structured })
      onClose()
      setUrl('')
      setPreview('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败')
    } finally {
      setParsing(false)
    }
  }

  const handleUseTextOnly = () => {
    const text = preview.trim()
    if (!text) {
      setError('请先拉取页面')
      return
    }
    onApply({ rawJD: text, url: url.trim() })
    onClose()
    setUrl('')
    setPreview('')
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id={titleId} className="text-sm font-semibold tracking-tight text-slate-800">
            从招聘链接解析
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            aria-label="关闭"
          >
            <X className="size-[18px]" strokeWidth={1.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <p className="text-[11px] leading-relaxed text-slate-600">
            通过公开代理拉取页面文本（部分站点可能受限）。若失败，请复制页面全文到岗位表单的「职位描述」中手动解析。
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="parse-url">
              招聘页 URL
            </label>
            <input
              id="parse-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={fieldClass}
              placeholder="https://..."
            />
          </div>
          <button
            type="button"
            onClick={() => void handleFetch()}
            disabled={loading || !url.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-[18px] animate-spin text-slate-400" strokeWidth={1.5} aria-hidden />
            ) : (
              <Link2 className="size-[18px] text-slate-400" strokeWidth={1.5} aria-hidden />
            )}
            拉取页面文本
          </button>
          {preview ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">正文预览（前 4000 字）</label>
              <textarea
                readOnly
                value={preview}
                rows={8}
                className={`${fieldClass} resize-y font-mono text-[11px]`}
              />
            </div>
          ) : null}
          {error ? (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50/90"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleUseTextOnly()}
            disabled={!preview.trim()}
            className="flex-1 rounded-lg border border-slate-200/90 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50/90 disabled:opacity-50"
          >
            仅填入原文
          </button>
          <button
            type="button"
            onClick={() => void handleAiParse()}
            disabled={parsing || !preview.trim()}
            className="inline-flex flex-1 min-w-[8rem] items-center justify-center gap-2 rounded-lg bg-indigo-500/90 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {parsing ? (
              <Loader2 className="size-[18px] animate-spin text-white/90" strokeWidth={1.5} aria-hidden />
            ) : (
              <Sparkles className="size-[18px] text-white/90" strokeWidth={1.5} aria-hidden />
            )}
            AI 解析并打开表单
          </button>
        </div>
      </div>
    </div>
  )
}
