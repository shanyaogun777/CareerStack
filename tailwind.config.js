/**
 * Tailwind CSS v4 由 `@tailwindcss/vite` 与 `src/index.css` 中的 `@import 'tailwindcss'` 驱动。
 * 默认主题色为 oklch；为兼容 PDF 导出（html-to-image），在 `src/index.css` 的 `@theme { }` 内
 * 将 gray / red / amber / slate / zinc 覆盖为十六进制，并在 `.resume-export-mode` 下对半透明工具类强制 rgba。
 *
 * 字体与点睛色以 `src/index.css` 的 `@theme` 为单一事实来源；此处仅作文档化镜像，便于 IDE 与团队查阅。
 */
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Source Sans 3"',
          '"SF Pro Display"',
          '"PingFang SC"',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        editorial: [
          'Fraunces',
          '"Noto Serif SC"',
          '"Songti SC"',
          'Georgia',
          '"Times New Roman"',
          'serif',
        ],
        landing: [
          '"Source Sans 3"',
          '"SF Pro Display"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
}
