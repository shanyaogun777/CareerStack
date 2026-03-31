import { JOB_STATUSES } from '../../services/db'
import { cn } from '../../lib/cn'

/**
 * @param {{ job: import('../../services/db.js').Job; selected: boolean; onClick: () => void }} props
 */
function JobCard({ job, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full border bg-white/95 p-4 text-left shadow-[0_8px_18px_rgba(18,18,18,0.04)] transition-all duration-200',
        selected
          ? 'border-[var(--color-accent)]/35 ring-1 ring-[var(--color-accent)]/25'
          : 'border-zinc-200/90 hover:border-zinc-300/85 hover:bg-zinc-50/70',
      )}
    >
      <div className="text-[13px] font-semibold tracking-tight text-slate-800 line-clamp-2">
        {job.position || '未命名职位'}
      </div>
      <div className="mt-0.5 text-[11px] leading-relaxed text-slate-500 line-clamp-1">
        {job.company || '未填公司'}
      </div>
    </button>
  )
}

/**
 * @param {{
 *   jobs: import('../../services/db.js').Job[]
 *   selectedId: number | null
 *   onSelect: (id: number) => void
 * }} props
 */
export function JobKanban({ jobs, selectedId, onSelect }) {
  /** @type {Record<string, import('../../services/db.js').Job[]>} */
  const byStatus = {}
  for (const s of JOB_STATUSES) {
    byStatus[s] = []
  }
  for (const j of jobs) {
    const k = JOB_STATUSES.includes(j.status) ? j.status : '待投递'
    byStatus[k].push(j)
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-3 overflow-x-auto pb-2">
      {JOB_STATUSES.map((status) => (
        <section
          key={status}
          className="flex w-[228px] shrink-0 flex-col border border-zinc-200/90 bg-zinc-50/55"
          aria-label={status}
        >
          <header className="border-b border-zinc-200/90 px-3 py-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {status}
              <span className="ml-1.5 font-normal text-zinc-400">({byStatus[status].length})</span>
            </h3>
          </header>
          <ul className="flex min-h-[120px] flex-col gap-2.5 overflow-y-auto p-3">
            {byStatus[status].map((job) => (
              <li key={job.id}>
                <JobCard
                  job={job}
                  selected={job.id === selectedId}
                  onClick={() => onSelect(job.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
