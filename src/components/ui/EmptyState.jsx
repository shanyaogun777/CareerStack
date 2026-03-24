import { cn } from '../../lib/cn'

/**
 * @param {{
 *   icon?: import('react').ReactNode
 *   title: string
 *   description?: string
 *   className?: string
 *   children?: import('react').ReactNode
 * }} props
 */
export function EmptyState({ icon, title, description, className, children }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white px-8 py-14 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-100/90 text-indigo-400/75">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-semibold tracking-tight text-slate-800">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-600">{description}</p>
      ) : null}
      {children ? <div className="mt-4 w-full max-w-xs">{children}</div> : null}
    </div>
  )
}
