import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'

/**
 * 可点击编辑的纯文本节点；失焦时提交，避免受控 contentEditable 抖动。
 * @param {{
 *   value: string
 *   onCommit: (next: string) => void
 *   className?: string
 *   as?: 'span' | 'div' | 'p'
 * }} props
 */
export function EditablePlain({
  value,
  onCommit,
  className,
  as = 'span',
}) {
  const ref = useRef(/** @type {HTMLElement | null} */ (null))
  const Element = as

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (document.activeElement === el) return
    const next = value ?? ''
    if (el.textContent !== next) {
      el.textContent = next
    }
  }, [value])

  return (
    <Element
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={cn(
        'outline-none ring-0 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-gray-300',
        className,
      )}
      onBlur={(e) => onCommit(e.currentTarget.textContent ?? '')}
    />
  )
}
