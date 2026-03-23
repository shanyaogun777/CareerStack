/**
 * @param {{ tags: string[]; className?: string }} props
 */
export function TagChips({ tags, className = '' }) {
  const list = (tags || []).map((t) => t.trim()).filter(Boolean)
  if (list.length === 0) {
    return (
      <span className="text-xs text-gray-400" aria-hidden>
        —
      </span>
    )
  }
  return (
    <ul
      className={`flex flex-wrap gap-1.5 ${className}`.trim()}
      aria-label="标签"
    >
      {list.map((tag, i) => (
        <li key={`${tag}-${i}`}>
          <span className="inline-flex max-w-full truncate rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-600">
            {tag}
          </span>
        </li>
      ))}
    </ul>
  )
}
