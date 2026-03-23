import { Component } from 'react'

/**
 * 捕获子树内未处理异常，避免整页白屏（如 AI 解析、第三方库抛错）。
 */
export class ErrorBoundary extends Component {
  /** @type {{ hasError: boolean; message: string }} */
  state = { hasError: false, message: '' }

  /**
   * @param {{ error: Error }} p
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) }
  }

  /**
   * @param {{ error: Error }} p
   */
  componentDidCatch(error, info) {
    console.error('[CareerStack]', error, info?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="max-w-md rounded-2xl border border-red-100 bg-red-50/80 px-6 py-8">
            <h1 className="text-base font-semibold text-red-900">页面出错了</h1>
            <p className="mt-2 text-sm leading-relaxed text-red-800/90">
              {this.state.message || '未知错误'}
            </p>
            <p className="mt-3 text-xs text-red-700/80">
              你的本地数据仍在 IndexedDB 中，未丢失。可尝试刷新页面或从侧栏「设置」导出备份。
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-red-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
