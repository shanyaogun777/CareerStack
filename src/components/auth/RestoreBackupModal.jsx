import { useLocation } from 'react-router-dom'
import { formatBackupDate } from '../../services/cloudBackup.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { MAIN_CONTENT_OVERLAY_BOX } from '../../lib/overlayLayout.js'

export function RestoreBackupModal() {
  const location = useLocation()
  const {
    pendingRestore,
    confirmRestoreFromCloud,
    skipRestoreAndUpload,
  } = useAuth()

  if (!pendingRestore) return null

  const label = formatBackupDate(pendingRestore.updatedAt)
  const underApp = location.pathname.startsWith('/app')
  const overlayBox = underApp ? MAIN_CONTENT_OVERLAY_BOX : 'inset-0'

  return (
    <div
      className={`fixed ${overlayBox} z-[150] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[2px]`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-backup-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl ring-1 ring-slate-100/80">
        <h2
          id="restore-backup-title"
          className="text-base font-semibold tracking-tight text-slate-800"
        >
          发现云端备份
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          更新于 <span className="font-medium text-slate-700">{label}</span>
          。是否用该备份覆盖当前本机数据？此操作会替换本地 IndexedDB 中的经历、简历与岗位。
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => void skipRestoreAndUpload()}
            className="order-2 rounded-lg border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:order-1"
          >
            保留本地并覆盖云端
          </button>
          <button
            type="button"
            onClick={() => void confirmRestoreFromCloud()}
            className="order-1 rounded-lg bg-indigo-500/90 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 sm:order-2"
          >
            使用云端备份
          </button>
        </div>
      </div>
    </div>
  )
}
