import { useCallback, useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { appPath } from '../lib/appPaths'
import { Building2, Link2, Plus } from 'lucide-react'
import { experienceRepository, jobRepository } from '../services/db'
import { JobKanban } from '../components/jobs/JobKanban'
import { JobFormDrawer } from '../components/jobs/JobFormDrawer'
import { JobDetailPanel } from '../components/jobs/JobDetailPanel'
import { ParseJobUrlModal } from '../components/jobs/ParseJobUrlModal'
import { EmptyState } from '../components/ui/EmptyState'

export function JobsPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState(/** @type {import('../services/db.js').Job[]} */ ([]))
  const [experiences, setExperiences] = useState(/** @type {import('../services/db.js').Experience[]} */ ([]))
  const [listError, setListError] = useState('')
  const [selectedId, setSelectedId] = useState(/** @type {number | null} */ (null))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState(/** @type {number | null} */ (null))
  const [parseUrlOpen, setParseUrlOpen] = useState(false)
  const [prefill, setPrefill] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const [j, ex] = await Promise.all([
        jobRepository.getAll(),
        experienceRepository.getAll(),
      ])
      setJobs(j)
      setExperiences(ex)
      setListError('')
    } catch (e) {
      setListError(e instanceof Error ? e.message : '加载失败')
    }
  }, [])

  useEffect(() => {
    function onExtensionMessage(e) {
      if (e.data?.source !== 'careerstack-extension' || e.data?.type !== 'JD_IMPORT') return
      const p = e.data.payload || {}
      setPrefill({
        url: String(p.url || ''),
        rawJD: String(p.rawJD || ''),
        company: p.company ? String(p.company) : '',
        position: p.position ? String(p.position) : '',
      })
      setEditingId(null)
      setDrawerOpen(true)
    }
    window.addEventListener('message', onExtensionMessage)
    return () => window.removeEventListener('message', onExtensionMessage)
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([jobRepository.getAll(), experienceRepository.getAll()])
      .then(([j, ex]) => {
        if (cancelled) return
        setJobs(j)
        setExperiences(ex)
        setListError('')
      })
      .catch((e) => {
        if (!cancelled) {
          setListError(e instanceof Error ? e.message : '加载失败')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedJob = useMemo(() => {
    if (selectedId == null) return null
    return jobs.find((x) => x.id === selectedId) ?? null
  }, [jobs, selectedId])

  const openCreate = () => {
    setEditingId(null)
    setPrefill(null)
    setDrawerOpen(true)
  }

  const openEdit = () => {
    if (selectedJob == null) return
    setEditingId(selectedJob.id)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditingId(null)
    setPrefill(null)
  }

  const handleDelete = async () => {
    if (selectedJob == null) return
    if (!window.confirm('确定删除该岗位？')) return
    await jobRepository.remove(selectedJob.id)
    setSelectedId(null)
    await refresh()
  }

  const handleStatusChange = async (status) => {
    if (selectedJob == null) return
    await jobRepository.update(selectedJob.id, { status })
    await refresh()
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-editorial text-2xl font-medium tracking-tight text-zinc-900">岗位库</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-600">
            管理目标岗位与 JD；使用 AI 解析后，系统会根据「关键技能点」从个人信息库推荐相关经历。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setParseUrlOpen(true)}
            className="inline-flex items-center gap-2 border border-zinc-200/90 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-[0_8px_20px_rgba(18,18,18,0.04)] transition-colors duration-200 hover:bg-zinc-50/90"
          >
            <Link2 className="size-[18px] text-slate-400" strokeWidth={1.5} aria-hidden />
            解析 URL
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_20px_rgba(18,18,18,0.08)] transition-colors duration-200 hover:bg-zinc-800"
          >
            <Plus className="size-[18px] text-white/90" strokeWidth={1.5} aria-hidden />
            添加岗位
          </button>
        </div>
      </header>

      {listError ? (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {listError}
        </p>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:overflow-hidden">
        <div className="flex min-h-[280px] min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0">
          {jobs.length === 0 && !listError ? (
            <EmptyState
              className="min-h-[240px] flex-1"
              icon={<Building2 className="size-7 text-current" strokeWidth={1.5} aria-hidden />}
              title="还没有岗位"
              description="从「添加岗位」粘贴 JD，或使用「解析 URL」拉取招聘页。解析后可匹配个人信息库、生成面试题。"
            >
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-slate-700"
                >
                  <Plus className="size-[18px] text-white/90" strokeWidth={1.5} aria-hidden />
                  添加岗位
                </button>
                <button
                  type="button"
                  onClick={() => setParseUrlOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50/90"
                >
                  <Link2 className="size-[18px] text-slate-400" strokeWidth={1.5} aria-hidden />
                  解析 URL
                </button>
              </div>
            </EmptyState>
          ) : (
            <JobKanban jobs={jobs} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>

        {selectedJob ? (
          <div className="flex h-[min(68vh,560px)] w-full shrink-0 flex-col overflow-hidden border border-zinc-200/90 bg-white/95 shadow-[0_10px_24px_rgba(18,18,18,0.04)] lg:h-auto lg:min-h-0 lg:w-[380px] lg:max-w-[40%]">
            <JobDetailPanel
              job={selectedJob}
              experiences={experiences}
              onEdit={openEdit}
              onDelete={() => void handleDelete()}
              onStatusChange={(st) => void handleStatusChange(st)}
              onNavigateToExperiences={() => navigate(appPath('experiences'))}
              onJobUpdated={() => void refresh()}
              onDismiss={() => {
                setSelectedId(null)
                setDrawerOpen(false)
                setEditingId(null)
                setPrefill(null)
              }}
            />
          </div>
        ) : (
          <div className="hidden border border-dashed border-zinc-200/80 bg-white/80 px-7 py-14 text-center lg:flex lg:w-[260px] lg:shrink-0 lg:items-center lg:justify-center">
            <p className="text-sm leading-relaxed text-zinc-500">点击看板卡片查看详情与素材推荐</p>
          </div>
        )}
      </div>

      <ParseJobUrlModal
        open={parseUrlOpen}
        onClose={() => setParseUrlOpen(false)}
        onApply={(p) => {
          setPrefill({
            rawJD: p.rawJD,
            url: p.url,
            structuredJD: p.structuredJD,
          })
          setParseUrlOpen(false)
          setEditingId(null)
          setDrawerOpen(true)
        }}
      />

      <JobFormDrawer
        open={drawerOpen}
        jobId={editingId}
        onClose={closeDrawer}
        onSaved={refresh}
        prefill={prefill}
        onConsumedPrefill={() => setPrefill(null)}
      />
    </div>
  )
}
