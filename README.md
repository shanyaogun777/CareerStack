# CareerStack

本地优先（Local-first）的求职工作台：在浏览器中管理个人信息素材、多份简历、目标岗位 JD、面试题库与「指挥部」数据看板。数据默认保存在本机 **IndexedDB**，不经过 CareerStack 自有服务器。

## 亮点

- **隐私**：简历、岗位、经历等核心数据仅存于用户浏览器；AI 功能通过你配置的 OpenAI 兼容接口（如 DeepSeek）直连调用。
- **离线可用（PWA）**：安装为应用后，静态资源由 Service Worker 缓存；断网仍可浏览已保存的简历与岗位（AI 与联网解析除外）。
- **导出 PDF**：基于 `html-to-image` + jsPDF，将 A4 画布栅格为 PNG 再写入 PDF，部署在 HTTPS 与同源静态资源下即可稳定运行。
- **数据迁移**：侧栏「设置」支持将 IndexedDB 全量导出 / 导入 JSON（含附件与头像的 Base64，以及指挥部「日历待办」`calendarTodos`；备份格式 v2，仍兼容 v1 导入），便于换机或换浏览器。

## 技术栈

React 19 · Vite 8 · React Router 7 · Dexie (IndexedDB) · Tailwind CSS 4 · Recharts · react-calendar · vite-plugin-pwa

## 本地运行

```bash
npm install
npm run dev
```

（仓库含 `.npmrc` 启用 `legacy-peer-deps`，以兼容 `vite-plugin-pwa` 与 Vite 8 的 peer 声明差异。）

浏览器打开终端提示的本地地址（默认 `http://localhost:5173`）。

```bash
npm run build
npm run preview
```

构建产物在 `dist/`，可用于任意静态托管（如 Vercel、Netlify、对象存储 + CDN）。

### 环境变量（可选）

复制 `.env.example` 为 `.env` 或 `.env.local`，按需填写。**不要**把含真实 API Key 的 `.env` 提交到公开仓库。

| 变量 | 说明 |
|------|------|
| `VITE_DEEPSEEK_API_KEY` | 构建时注入的默认 API Key（仍可在应用内「设置」覆盖） |
| `VITE_AI_BASE_URL` | 默认 OpenAI 兼容 Base URL |
| `VITE_AI_MODEL` | 默认模型名 |

> 说明：所有 `VITE_*` 会编译进前端包，仅适合私有构建或团队内部部署流水线。

## 安全与数据

- 代码库中**不应**硬编码任何 API Key；密钥来自本机 localStorage 或上述环境变量。
- 应用**不**提供自有后端账号体系；除你主动请求第三方 AI 接口外，数据不离开本机。
- 更换浏览器前请使用「设置 → 导出备份」保存 JSON，并在新环境「导入备份」。

## PWA 与图标

首次构建前可执行 `node scripts/generate-pwa-icons.mjs` 生成 `public/pwa-192.png` 与 `public/pwa-512.png`（亦已纳入仓库）。生产构建会注册 Service Worker 并生成 Web App Manifest。

## 部署（Vercel）

仓库根目录已包含 `vercel.json`，将 SPA 路由回退到 `index.html`。将项目连接 Vercel 后，构建命令 `npm run build`，输出目录 `dist`。

## Chrome 扩展（可选）

`extension/` 目录为 Boss 直聘页一键采集 JD 的雏形，详见其中 `README.md`。

## 许可证

私有项目按仓库约定使用。
