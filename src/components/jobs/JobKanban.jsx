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
        'w-full rounded-lg border bg-white p-3 text-left shadow-sm transition-colors',
        selected
          ? 'border-gray-900 ring-1 ring-gray-900'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/80',
      )}
    >
      <div className="text-[13px] font-semibold text-gray-900 line-clamp-2">{job.position || '未命名职位'}</div>
      <div className="mt-0.5 text-[11px] text-gray-500 line-clamp-1">{job.company || '未填公司'}</div>
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
          className="flex w-[220px] shrink-0 flex-col rounded-xl border border-gray-200/90 bg-gray-100/60"
          aria-label={status}
        >
          <header className="border-b border-gray-200/80 px-3 py-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-600">
              {status}
              <span className="ml-1.5 font-normal text-gray-400">({byStatus[status].length})</span>
            </h3>
          </header>
          <ul className="flex min-h-[120px] flex-col gap-2 overflow-y-auto p-2">
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
