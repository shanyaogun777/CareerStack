import { useEffect, useId, useRef, useState } from 'react'
import { Cloud, Download, Loader2, Upload, X } from 'lucide-react'
import { loadAiSettings, saveAiSettings } from '../../services/ai'
import { downloadBackupFile, importAllDataFromJson } from '../../services/dataBackup'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { Link } from 'react-router-dom'

const fieldClass =
  'w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100'

const labelClass = 'mb-1 block text-xs font-medium text-slate-600'

/**
 * 抽屉打开时挂载，从 localStorage 读取一次初始值（避免在 effect 里 setState）。
 * @param {{ onClose: () => void; titleId: string }} props
 */
function SettingsDrawerInner({ onClose, titleId }) {
  const {
    user,
    isSupabaseConfigured,
    syncToCloud,
  } = useAuth()
  const [cloudBusy, setCloudBusy] = useState(false)
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
    <div className="relative flex h-full w-full max-w-md flex-col border-l border-slate-100 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 id={titleId} className="text-sm font-semibold tracking-tight text-slate-800">
          设置
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

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <section>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            AI 接口
          </h3>
          <p className="mb-3 text-xs leading-relaxed text-slate-600">
            API Key 与 Base URL 优先保存在本机（localStorage）。可选在部署环境通过{' '}
            <code className="rounded bg-slate-100/90 px-1 py-0.5 text-[10px] text-slate-600">.env</code>{' '}
            提供 <code className="rounded bg-slate-100/90 px-1 py-0.5 text-[10px] text-slate-600">VITE_*</code>{' '}
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
              <p className="mt-1 text-[11px] text-slate-400">
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

        <section className="border-t border-slate-100 pt-5">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            云端同步
          </h3>
          <p className="mb-3 text-xs leading-relaxed text-slate-600">
            将当前本机 IndexedDB 全量备份上传至 Supabase（需登录）。断网时仍可继续使用本地功能。
          </p>
          {!isSupabaseConfigured ? (
            <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
              未配置 Supabase 环境变量，无法使用云端同步。
            </p>
          ) : !user ? (
            <p className="text-xs text-slate-600">
              请先{' '}
              <Link to="/login" className="font-medium text-indigo-500/90 underline-offset-2 hover:underline">
                登录
              </Link>{' '}
              后再同步。
            </p>
          ) : (
            <button
              type="button"
              disabled={cloudBusy}
              onClick={() => {
                setCloudBusy(true)
                void syncToCloud().finally(() => setCloudBusy(false))
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-100/90 bg-indigo-50/50 px-3 py-2.5 text-sm font-medium text-indigo-900 transition hover:bg-indigo-50 disabled:opacity-50"
            >
              {cloudBusy ? (
                <Loader2 className="size-[18px] animate-spin text-indigo-400" strokeWidth={1.5} aria-hidden />
              ) : (
                <Cloud className="size-[18px] text-indigo-400/90" strokeWidth={1.5} aria-hidden />
              )}
              立即同步
            </button>
          )}
        </section>

        <section className="border-t border-slate-100 pt-5">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            数据迁移
          </h3>
          <p className="mb-3 text-xs leading-relaxed text-slate-600">
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
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50/90 disabled:opacity-50"
            >
              <Download className="size-[18px] text-slate-400" strokeWidth={1.5} aria-hidden />
              导出备份
            </button>
            <button
              type="button"
              disabled={backupBusy}
              onClick={handlePickImport}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50/90 disabled:opacity-50"
            >
              <Upload className="size-[18px] text-slate-400" strokeWidth={1.5} aria-hidden />
              导入备份
            </button>
          </div>
          {backupMsg ? (
            <p
              className={`mt-2 text-xs ${backupMsg.includes('失败') || backupMsg.includes('不支持') ? 'text-red-600' : 'text-emerald-600/90'}`}
              role="status"
            >
              {backupMsg}
            </p>
          ) : null}
        </section>
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        {savedHint ? (
          <p className="mb-2 text-xs font-medium text-emerald-600/90">{savedHint}</p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50/90"
          >
            关闭
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700"
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
