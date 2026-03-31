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
        'flex flex-col items-center justify-center border border-dashed border-zinc-200/90 bg-gradient-to-b from-zinc-50/80 to-white px-8 py-14 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex size-14 items-center justify-center border border-zinc-200/80 bg-zinc-100/90 text-[var(--color-accent)]/80">
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
