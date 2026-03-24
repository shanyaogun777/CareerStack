import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  EXPERIENCE_CATEGORIES,
  EXPERIENCE_CATEGORY_LABELS,
  experienceRepository,
  normalizeExperienceCategory,
} from '../../services/db'
import { cn } from '../../lib/cn'
import { ExperienceCard } from './ExperienceCard'
import { ExperienceFormDrawer } from './ExperienceFormDrawer'

export function ExperienceLibrary() {
  const [items, setItems] = useState(
    /** @type {import('../../services/db.js').Experience[]} */ ([]),
  )
  const [listError, setListError] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState(/** @type {number | null} */ (null))
  const [activeTab, setActiveTab] = useState(
    /** @type {'education' | 'work' | 'project' | 'campus'} */ ('education'),
  )

  const refresh = useCallback(async () => {
    try {
      const rows = await experienceRepository.getAll()
      setItems(rows)
      setListError('')
    } catch (e) {
      setItems([])
      setListError(e instanceof Error ? e.message : '加载失败')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await experienceRepository.getAll()
        if (!cancelled) {
          setItems(rows)
          setListError('')
        }
      } catch (e) {
        if (!cancelled) {
          setItems([])
          setListError(e instanceof Error ? e.message : '加载失败')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setDrawerOpen(true)
  }

  /**
   * @param {import('../../services/db.js').Experience} row
   */
  const openEdit = (row) => {
    setEditingId(row.id)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditingId(null)
  }

  const filtered = items.filter(
    (e) => normalizeExperienceCategory(e.category) === activeTab,
  )

  return (
    <div className="w-full max-w-none">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-800">
            个人信息库
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
            按分类管理教育、工作、项目与校园素材；写入简历时仅为副本，原件始终在此维护。
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          <Plus className="size-[18px] text-white/90" strokeWidth={1.5} aria-hidden />
          新增条目
        </button>
      </header>

      <div
        className="mb-6 flex flex-wrap gap-1 border-b border-slate-100"
        role="tablist"
        aria-label="素材分类"
      >
        {EXPERIENCE_CATEGORIES.map((cat) => {
          const count = items.filter(
            (e) => normalizeExperienceCategory(e.category) === cat,
          ).length
          const active = activeTab === cat
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(cat)}
              className={cn(
                'relative px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'text-slate-800 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-slate-700/80'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {EXPERIENCE_CATEGORY_LABELS[cat]}
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {listError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {listError}
        </p>
      ) : null}

      {filtered.length === 0 && !listError ? (
        <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/70 px-8 py-16 text-center">
          <p className="text-sm leading-relaxed text-slate-500">
            当前分类下暂无条目
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            点击「新增条目」并选择对应分类，或切换到其他分类查看。
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((exp) => (
            <li key={exp.id}>
              <ExperienceCard experience={exp} onOpen={openEdit} />
            </li>
          ))}
        </ul>
      )}

      <ExperienceFormDrawer
        open={drawerOpen}
        experienceId={editingId}
        onClose={closeDrawer}
        onSaved={refresh}
        initialCategory={activeTab}
      />
    </div>
  )
}
