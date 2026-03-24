import { createElement } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  Database,
  FileDown,
  Github,
  Sparkles,
} from 'lucide-react'
import { APP_BASE } from '../lib/appPaths'
import { useAuth } from '../contexts/AuthContext.jsx'

const FEATURES = [
  {
    title: '隐私安全',
    body: '经历、简历与岗位默认仅存于本机 IndexedDB，数据不上传 CareerStack 服务器。',
    icon: Database,
  },
  {
    title: 'AI 智能解析',
    body: '对接你自有的 API，解析 JD、润色经历、生成面试题，调用直连模型服务商。',
    icon: Sparkles,
  },
  {
    title: '高精度 PDF',
    body: '基于 A4 画布栅格导出，版式稳定，便于投递与归档。',
    icon: FileDown,
  },
  {
    title: '面试工作台',
    body: '按岗位管理题库，STAR 草稿与面经解析集中备战。',
    icon: ClipboardList,
  },
]

const GITHUB_USER = 'shanyaogun777'
const XHS_NAME = '虎皮小耶'

function XiaohongshuGlyph({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" className="fill-[#ff2442]/90" />
      <path
        d="M8 8.5h8M8 12h5.5M8 15.5h6.5"
        className="stroke-white"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * 社交链接：悬停显示平台用户名（移动端可长按或依赖 title）
 */
function SocialIconLink({ href, label, username, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`${label}：${username}`}
      aria-label={`${label}：${username}`}
      className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-800 shadow-sm transition hover:border-slate-300"
    >
      {children}
      <span
        className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800/95 px-3 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        role="tooltip"
      >
        {username}
      </span>
    </a>
  )
}

export function LandingPage() {
  const { user, loading, signOut } = useAuth()

  return (
    <div className="font-landing flex min-h-svh flex-col bg-[#fafbfc] text-slate-800 antialiased">
      {/* Mesh：极低透明度蓝紫光晕（各层 α ≤ 10%） */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_85%_at_50%_-15%,rgba(99,102,241,0.08),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_100%_35%,rgba(139,92,246,0.07),transparent_52%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_45%_at_0%_85%,rgba(59,130,246,0.08),transparent_55%)]" />
        <div className="absolute left-1/2 top-1/3 h-[min(420px,55vh)] w-[min(420px,70vw)] -translate-x-1/2 rounded-full bg-indigo-400/[0.06] blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[min(360px,45vh)] w-[min(360px,55vw)] rounded-full bg-violet-400/[0.05] blur-[90px]" />
      </div>

      <header className="relative z-10 shrink-0 border-b border-slate-100/80 bg-white/70 px-5 py-4 backdrop-blur-md md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <span className="text-[15px] font-bold tracking-tighter text-slate-800 antialiased">
            CareerStack
          </span>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            {!loading && user ? (
              <>
                <span
                  className="hidden max-w-[10rem] truncate text-xs text-slate-500 sm:inline"
                  title={user.email ?? ''}
                >
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  退出
                </button>
              </>
            ) : !loading ? (
              <Link
                to="/login"
                className="rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                登录 / 注册
              </Link>
            ) : null}
            <Link
              to={APP_BASE}
              className="rounded-full bg-slate-800 px-4 py-2 text-sm font-medium tracking-wide text-white shadow-sm transition hover:bg-slate-700"
            >
              进入工作台
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* 主标题区：在顶栏与下方内容之间垂直居中 */}
        <section className="flex flex-1 flex-col justify-center px-5 py-24 text-center md:py-32">
          <div className="mx-auto w-full max-w-3xl">
            <div
              className="animate-careerstack-fade-in-up mb-6 space-y-1.5"
              style={{ animationDelay: '40ms' }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 antialiased">
                本地优先 · 求职工作台
              </p>
              <p
                lang="en"
                className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600 antialiased md:text-[11px]"
              >
                Local-first · Job workspace
              </p>
            </div>
            <h1
              className="animate-careerstack-fade-in-up text-balance antialiased"
              style={{ animationDelay: '90ms' }}
            >
              <span className="font-hero-cn block bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent text-5xl font-normal tracking-tighter sm:text-6xl md:text-6xl md:leading-[1.12] lg:text-7xl">
                让 Offer 触手可及
              </span>
              <span
                lang="en"
                className="font-hero-en mt-3 block bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent text-lg font-semibold tracking-tight sm:text-xl md:mt-4 md:text-2xl lg:text-[1.65rem] lg:leading-snug"
              >
                Offers Within Reach
              </span>
            </h1>
            <div
              className="animate-careerstack-fade-in-up mx-auto mt-8 max-w-2xl text-pretty md:mt-10"
              style={{ animationDelay: '160ms' }}
            >
              <p className="text-base leading-relaxed text-slate-800 md:text-lg">
                在浏览器本地管理简历与岗位，AI 按你的密钥调用；从素材整理到面试备战，一条链路完成。
              </p>
              <p
                lang="en"
                className="mt-3 text-sm leading-relaxed text-slate-800 md:text-[15px]"
              >
                Manage resumes and jobs locally in your browser; AI uses your own API keys—from
                materials to interview prep, one seamless flow.
              </p>
            </div>
            <div
              className="animate-careerstack-fade-in-up mt-10 flex justify-center md:mt-12"
              style={{ animationDelay: '220ms' }}
            >
              <Link
                to={APP_BASE}
                className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-full bg-indigo-500/90 px-8 py-3 text-sm font-medium tracking-wide text-white shadow-md shadow-indigo-500/15 transition hover:bg-indigo-500"
              >
                立即开启工作台
              </Link>
            </div>
          </div>
        </section>

        <section className="shrink-0 border-t border-slate-100/90 bg-white/50 px-5 py-16 backdrop-blur-sm md:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-bold tracking-tighter text-slate-800 antialiased md:text-3xl">
              为认真求职的人设计
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-slate-800">
              四项能力，覆盖从素材沉淀到投递与面试的闭环。
            </p>
            <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ title, body, icon }, i) => (
                <li
                  key={title}
                  className="animate-careerstack-fade-in-up flex flex-col rounded-2xl border border-slate-100 bg-white/95 p-6 shadow-sm transition-transform duration-300 ease-out will-change-transform hover:-translate-y-1"
                  style={{ animationDelay: `${280 + i * 75}ms` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-indigo-400/85">
                    {createElement(icon, {
                      className: 'size-[22px]',
                      strokeWidth: 1.5,
                      'aria-hidden': true,
                    })}
                  </div>
                  <h3 className="text-base font-bold tracking-tighter text-slate-800 antialiased">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-800">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="relative z-10 mt-auto shrink-0 border-t border-slate-100 bg-white/40 px-5 py-10 text-center backdrop-blur-sm md:py-12">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-800 antialiased">
            联系我们
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <SocialIconLink
              href={`https://github.com/${GITHUB_USER}`}
              label="GitHub"
              username={GITHUB_USER}
            >
              <Github className="size-5" strokeWidth={1.5} aria-hidden />
            </SocialIconLink>
            <SocialIconLink
              href="https://www.xiaohongshu.com"
              label="小红书"
              username={XHS_NAME}
            >
              <XiaohongshuGlyph className="size-6" />
            </SocialIconLink>
          </div>
          <p className="mx-auto mt-8 max-w-md text-xs leading-relaxed text-slate-800/80">
            数据默认仅存本机；请妥善保管 API Key 与备份文件。
          </p>
        </footer>
      </main>
    </div>
  )
}
