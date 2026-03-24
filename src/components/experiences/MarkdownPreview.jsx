import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const markdownComponents = {
  a: ({ href, children, title, className }) => (
    <a
      href={href}
      title={title}
      className={className}
      target="_blank"
      rel="noreferrer noopener"
    >
      {children}
    </a>
  ),
}

/**
 * @param {{ markdown: string; emptyHint?: string; className?: string; compact?: boolean }} props
 */
export function MarkdownPreview({
  markdown,
  emptyHint = '暂无描述',
  className = '',
  compact = false,
}) {
  const src = markdown?.trim() ? markdown : ''

  if (!src) {
    return (
      <p className="text-sm italic text-slate-400">{emptyHint}</p>
    )
  }

  const proseSize = compact
    ? 'prose prose-sm max-w-none prose-gray [&]:text-[11px] [&_p]:text-[11px] [&_li]:text-[11px] [&_ol]:text-[11px] [&_ul]:text-[11px] [&_strong]:text-[11px]'
    : 'prose prose-sm max-w-none prose-gray'

  return (
    <div className={`experience-md ${className}`.trim()}>
      <div
        className={`${proseSize} prose-headings:font-semibold prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600 prose-table:text-sm prose-th:border prose-th:border-slate-100 prose-td:border prose-td:border-slate-100`}
        lang="zh-Hans"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {src}
        </ReactMarkdown>
      </div>
    </div>
  )
}
