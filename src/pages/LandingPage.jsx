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
      className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white text-zinc-800 shadow-sm transition hover:border-zinc-300"
    >
      {children}
      <span
        className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900/95 px-3 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
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
    <div className="font-landing relative flex min-h-svh flex-col bg-[#f7f6f4] text-zinc-800 antialiased">
      <div className="landing-grain" aria-hidden />

      <header className="relative z-10 shrink-0 border-b border-zinc-200/70 bg-white/80 px-5 py-6 backdrop-blur-md md:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <span className="font-editorial text-lg font-medium tracking-tight text-zinc-900 md:text-xl">
            CareerStack
          </span>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            {!loading && user ? (
              <>
                <span
                  className="hidden max-w-[10rem] truncate text-xs text-zinc-500 sm:inline"
                  title={user.email ?? ''}
                >
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-full border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                >
                  退出
                </button>
              </>
            ) : !loading ? (
              <Link
                to="/login"
                className="rounded-full border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                登录 / 注册
              </Link>
            ) : null}
            <Link
              to={APP_BASE}
              className="rounded-full bg-zinc-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-zinc-800 md:text-sm md:tracking-normal"
            >
              进入工作台
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col">
        <section className="flex flex-1 flex-col justify-center px-5 py-20 text-center md:px-10 md:py-28 lg:py-36">
          <div className="mx-auto w-full max-w-4xl">
            <div
              className="animate-careerstack-fade-in-up mb-10 space-y-2 md:mb-12"
              style={{ animationDelay: '40ms' }}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-500">
                本地优先 · 求职工作台
              </p>
              <p
                lang="en"
                className="text-[10px] font-medium uppercase tracking-[0.28em] text-zinc-500 md:text-[11px]"
              >
                Local-first · Job workspace
              </p>
            </div>
            <h1
              className="animate-careerstack-fade-in-up text-balance"
              style={{ animationDelay: '90ms' }}
            >
              <span className="font-hero-cn block text-5xl font-normal leading-[1.05] tracking-tight text-zinc-900 sm:text-6xl md:text-7xl lg:text-8xl">
                让工作触手可及
              </span>
              <span
                lang="en"
                className="font-hero-en mt-3 block text-lg font-normal italic leading-snug tracking-tight text-zinc-600 md:mt-5 md:text-2xl lg:text-[1.75rem]"
              >
                Offers Within Reach
              </span>
            </h1>
            <div
              className="animate-careerstack-fade-in-up mx-auto mt-12 max-w-2xl md:mt-10"
              style={{ animationDelay: '160ms' }}
            >
              <p className="text-base leading-relaxed text-zinc-700 md:text-lg md:leading-relaxed">
                在浏览器本地管理简历与岗位，AI 按你的密钥调用；从素材整理到面试备战，一条链路完成。
              </p>
              <p
                lang="en"
                className="mt-4 text-sm leading-relaxed text-zinc-600 md:text-[15px] md:leading-relaxed"
              >
                Manage resumes and jobs locally in your browser; AI uses your own API keys—from
                materials to interview prep, one seamless flow.
              </p>
            </div>
            <div
              className="animate-careerstack-fade-in-up mt-12 flex justify-center md:mt-14"
              style={{ animationDelay: '220ms' }}
            >
              <Link
                to={APP_BASE}
                className="inline-flex min-h-[52px] min-w-[220px] items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-10 py-3.5 text-sm font-semibold tracking-wide text-white transition hover:bg-zinc-800"
              >
                立即开启工作台
              </Link>
            </div>
          </div>
        </section>

        <section className="shrink-0 border-t border-zinc-200/80 bg-white/60 px-5 py-20 backdrop-blur-[2px] md:px-10 md:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-editorial text-center text-4xl font-normal leading-tight tracking-tight text-zinc-900 md:text-6xl md:leading-[1.08]">
              全方位助力求职
            </h2>
            <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-8">
              {FEATURES.map(({ title, body, icon }, i) => (
                <li
                  key={title}
                  className="animate-careerstack-fade-in-up flex flex-col border border-zinc-200/90 bg-white/90 p-8 transition-shadow duration-300 ease-out hover:shadow-sm"
                  style={{ animationDelay: `${280 + i * 75}ms` }}
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center border border-zinc-200/90 bg-zinc-50 text-zinc-700">
                    {createElement(icon, {
                      className: 'size-[22px]',
                      strokeWidth: 1.5,
                      'aria-hidden': true,
                    })}
                  </div>
                  <h3 className="font-editorial text-lg font-medium tracking-tight text-zinc-900">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="relative z-10 mt-auto shrink-0 border-t border-zinc-200/80 bg-white/50 px-5 py-14 text-center backdrop-blur-sm md:py-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-500">
            联系我们
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <SocialIconLink
              href={`https://github.com/shanyaogun777`}
              label="GitHub"
              username={GITHUB_USER}
            >
              <Github className="size-5" strokeWidth={1.5} aria-hidden />
            </SocialIconLink>
            <SocialIconLink
              href=" https://xhslink.com/m/8duEbH6pXjH"
              label="小红书"
              username={XHS_NAME}
            >
              <XiaohongshuGlyph className="size-6" />
            </SocialIconLink>
          </div>
          <p className="mx-auto mt-10 max-w-md text-xs leading-relaxed text-zinc-500">
            数据默认仅存本机；请妥善保管 API Key 与备份文件。
          </p>
        </footer>
      </main>
    </div>
  )
}
