import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

/** A4 纵向比例约 1 : √2；与画布 `w-[794px] min-h-[1123px]` 对齐 */
export const RESUME_A4_CSS_WIDTH_PX = 794

const EXPORT_CLASS = 'resume-export-mode'

/**
 * @param {string} dataUrl
 * @returns {Promise<{ width: number; height: number }>}
 */
function loadDataUrlDimensions(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('无法加载导出图片'))
    img.src = dataUrl
  })
}

/**
 * 生成导出文件名：`简历_[标题]_[YYYY-MM-DD].pdf`
 * @param {string} resumeTitle
 */
export function buildResumePdfFilename(resumeTitle) {
  const safe = String(resumeTitle ?? '')
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .slice(0, 80)
  const base = safe || '未命名'
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `简历_${base}_${y}-${m}-${day}.pdf`
}

/**
 * 使用 `html-to-image` 将 A4 简历节点栅格为 PNG，再经 jsPDF 压入单页 PDF。
 * 导出前在 `root` 上添加 `resume-export-mode`，由 `index.css` 隐藏 `.resume-ui-only` 等编辑层。
 *
 * @param {HTMLElement} root - 白底画布根节点（建议宽度 {@link RESUME_A4_CSS_WIDTH_PX}px）
 * @param {string} resumeTitle - 简历标题，用于文件名
 * @returns {Promise<string>} 实际保存的文件名（含 `.pdf`）
 */
export async function exportResumeToPdf(root, resumeTitle) {
  const filename = buildResumePdfFilename(resumeTitle)

  root.classList.add(EXPORT_CLASS)
  await document.fonts.ready
  await new Promise((r) => requestAnimationFrame(r))
  await new Promise((r) => requestAnimationFrame(r))

  try {
    const imgData = await toPng(root, {
      quality: 1,
      pixelRatio: Math.min(3, typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2),
      skipFonts: false,
      backgroundColor: '#ffffff',
      cacheBust: true,
      fetchRequestInit: { cache: 'no-store' },
    })

    const { width: pxW, height: pxH } = await loadDataUrlDimensions(imgData)

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()

    const imgWmm = pageW
    const imgHmm = (pxH * pageW) / pxW

    if (imgHmm <= pageH) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWmm, imgHmm, undefined, 'FAST')
    } else {
      const h = pageH
      const w = (pxW * pageH) / pxH
      const x = (pageW - w) / 2
      pdf.addImage(imgData, 'PNG', x, 0, w, h, undefined, 'FAST')
    }

    pdf.save(filename)
    return filename
  } finally {
    root.classList.remove(EXPORT_CLASS)
  }
}
