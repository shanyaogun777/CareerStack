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
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gradient-to-b from-gray-50/80 to-white px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-gray-500">{description}</p>
      ) : null}
      {children ? <div className="mt-4 w-full max-w-xs">{children}</div> : null}
    </div>
  )
}
