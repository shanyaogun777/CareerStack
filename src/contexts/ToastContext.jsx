import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/**
 * @typedef {{ id: number; message: string; variant?: 'default' | 'error' | 'success' }} ToastItem
 */

const ToastContext = createContext(
  /** @type {{ showToast: (message: string, variant?: ToastItem['variant']) => void }} */ ({
    showToast: () => {},
  }),
)

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(/** @type {ToastItem | null} */ (null))

  const showToast = useCallback((message, variant = 'default') => {
    const id = Date.now()
    setToast({ id, message, variant })
    window.setTimeout(() => {
      setToast((t) => (t?.id === id ? null : t))
    }, 4200)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-[200] w-[min(100%,22rem)] -translate-x-1/2 px-4"
          role="status"
        >
          <div
            className={[
              'pointer-events-auto rounded-xl border px-4 py-3 text-center text-sm shadow-lg',
              toast.variant === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : toast.variant === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-slate-200 bg-white text-slate-800',
            ].join(' ')}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- context consumer hook
export function useToast() {
  return useContext(ToastContext)
}
