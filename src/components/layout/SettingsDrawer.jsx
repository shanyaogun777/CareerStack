import { useEffect, useId, useRef, useState } from 'react'
import { Download, Upload, X } from 'lucide-react'
import { loadAiSettings, saveAiSettings } from '../../services/ai'
import { downloadBackupFile, importAllDataFromJson } from '../../services/dataBackup'

const fieldClass =
  'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200'

const labelClass = 'mb-1 block text-xs font-medium text-gray-700'

/**
 * 抽屉打开时挂载，从 localStorage 读取一次初始值（避免在 effect 里 setState）。
 * @param {{ onClose: () => void; titleId: string }} props
 */
function SettingsDrawerInner({ onClose, titleId }) {
  const initial = loadAiSettings()
  const [apiKey, setApiKey] = useState(initial.apiKey)
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl)
  const [model, setModel] = useState(initial.model)
  const [savedHint, setSavedHint] = useState('')
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupMsg, setBackupMsg] = useState('')
  const fileRef = useRef(/** @type {HTMLInputElement | null} */ (null))

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSave = () => {
    saveAiSettings({
      apiKey,
      baseUrl,
      model,
    })
    setSavedHint('已保存到本机浏览器')
    setTimeout(() => setSavedHint(''), 2400)
  }

  const handleExportBackup = async () => {
    setBackupMsg('')
    setBackupBusy(true)
    try {
      await downloadBackupFile()
      setBackupMsg('备份文件已下载')
      setTimeout(() => setBackupMsg(''), 3200)
    } catch (e) {
      setBackupMsg(e instanceof Error ? e.message : '导出失败')
    } finally {
      setBackupBusy(false)
    }
  }

  const handlePickImport = () => {
    fileRef.current?.click()
  }

  /**
   * @param {import('react').ChangeEvent<HTMLInputElement>} e
   */
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBackupMsg('')
    setBackupBusy(true)
    try {
      const text = await file.text()
      await importAllDataFromJson(text)
      setBackupMsg('导入成功，即将刷新页面…')
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      setBackupMsg(err instanceof Error ? err.message : '导入失败')
    } finally {
      setBackupBusy(false)
    }
  }

  return (
    <div className="relative flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 id={titleId} className="text-sm font-semibold text-gray-900">
          设置
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          aria-label="关闭"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <section>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
            AI 接口
          </h3>
          <p className="mb-3 text-xs leading-relaxed text-gray-500">
            API Key 与 Base URL 优先保存在本机（localStorage）。可选在部署环境通过{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-[10px]">.env</code>{' '}
            提供 <code className="rounded bg-gray-100 px-1 py-0.5 text-[10px]">VITE_*</code>{' '}
            默认值（会打进前端包，勿用于公开仓库）。
          </p>

          <div className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="ai-api-key">
                API Key
              </label>
              <input
                id="ai-api-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={fieldClass}
                placeholder="sk-…"
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="ai-base-url">
                Base URL
              </label>
              <input
                id="ai-base-url"
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className={fieldClass}
                placeholder="https://api.openai.com/v1"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                DeepSeek 示例：https://api.deepseek.com/v1
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="ai-model">
                模型名称
              </label>
              <input
                id="ai-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={fieldClass}
                placeholder="gpt-4o-mini / deepseek-chat"
              />
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 pt-4">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
            数据迁移
          </h3>
          <p className="mb-3 text-xs leading-relaxed text-gray-500">
            将 IndexedDB 中的经历、简历、岗位导出为 JSON；在新浏览器选择文件导入即可恢复（会覆盖当前本地数据）。
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-hidden
            onChange={(e) => void handleImportFile(e)}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={backupBusy}
              onClick={() => void handleExportBackup()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="size-4" strokeWidth={2} aria-hidden />
              导出备份
            </button>
            <button
              type="button"
              disabled={backupBusy}
              onClick={handlePickImport}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="size-4" strokeWidth={2} aria-hidden />
              导入备份
            </button>
          </div>
          {backupMsg ? (
            <p
              className={`mt-2 text-xs ${backupMsg.includes('失败') || backupMsg.includes('不支持') ? 'text-red-600' : 'text-emerald-700'}`}
              role="status"
            >
              {backupMsg}
            </p>
          ) : null}
        </section>
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        {savedHint ? (
          <p className="mb-2 text-xs font-medium text-emerald-600">{savedHint}</p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            关闭
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800"
          >
            保存 AI 设置
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * @param {{ open: boolean; onClose: () => void }} props
 */
export function SettingsDrawer({ open, onClose }) {
  const titleId = useId()

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="关闭设置"
        onClick={onClose}
      />
      <SettingsDrawerInner onClose={onClose} titleId={titleId} />
    </div>
  )
}
