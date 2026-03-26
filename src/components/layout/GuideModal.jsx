import { useEffect, useId } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { X } from 'lucide-react'
import { MAIN_CONTENT_OVERLAY_BOX } from '../../lib/overlayLayout.js'

const GUIDE_MARKDOWN = `
## 登录 / 注册

- 在侧栏底部点击 **登录 / 注册** 进入登录页。
- 支持 **邮箱 Magic Link**（一次性链接）、**密码登录** 与 **注册新账号**。
- 忘记密码时，在密码登录模式下点击 **忘记密码？**，系统会向邮箱发送重置链接；打开邮件中的链接后，在 **重置密码** 页设置新密码。
- 可选登录 **Supabase** 账号以启用云端备份；不登录时所有业务数据仍可在本机正常使用（Local-first）。

## 数据保存

- **默认**：经历、简历、岗位等核心数据保存在浏览器 **IndexedDB**，不会上传到 CareerStack 自有服务器。
- **云端同步**：登录并配置 Supabase 后，可在 **设置 → 云端同步** 或使用 **立即同步** 将当前本机全量备份上传；新设备登录后可根据提示从云端恢复或保留本地并覆盖云端。
- **导出/导入**：设置中支持将数据导出为 JSON 文件，便于迁移或冷备份。

## API 填写与调用

1. 点击侧栏 **设置** 打开抽屉。
2. 在 **AI 接口** 中填写 **API Key**、**Base URL**（如 OpenAI 兼容接口）与 **模型名称**；密钥优先保存在本机 localStorage（部署时也可用环境变量提供默认值，勿将密钥提交到公开仓库）。
3. 在 **Prompt 管理** 中可按场景编辑系统提示词（如 JD 解析、匹配分析、面试题生成、简历润色等），内容保存在本机 localStorage；留空或未修改时使用内置默认提示词。修改后再次调用 AI 即按新提示词执行；若模型返回格式异常，请对照各功能对 JSON 字段的约定检查提示词。
4. 保存后，**岗位库** 中的 **AI 智能解析 JD**、**匹配度诊断**、**简历润色**、**面试题生成/解析** 等功能会通过你配置的地址与密钥直连模型服务商；请求由你的浏览器发起，不经过 CareerStack 后端中转。

## 各模块使用方式

| 模块 | 说明 |
|------|------|
| **个人信息库** | 按分类维护经历条目，支持 Markdown；可作为简历素材与岗位匹配的素材源。 |
| **简历生成中心** | 从素材库拖拽/编排内容，生成与导出简历（含 PDF）。导出时画布会进入导出模式，自动隐藏拖拽手柄、Markdown 源码编辑区、「预览」标签等界面元素，生成的 PDF 仅保留正式简历内容，不含上述辅助控件。 |
| **岗位库** | 看板管理投递状态；可解析 JD、编辑结构化字段、查看与岗位的素材推荐及匹配分析。 |
| **指挥部** | 总览日程与进度类信息（视当前版本功能而定）。 |
| **专项面试** | 岗位驱动的分阶段模拟：先进入岗位列表，点击某一岗位卡片进入该岗位的面试详情页。 |

### 简历生成：灵活排版

在简历画布中，每个大模块（基本信息、教育背景、工作/实习、项目经历、校园经历、自我评价以及自定义模块）顶部都有「排序」拖拽手柄。按住后可上下调整模块顺序，右侧预览会实时更新，导出 PDF 时严格按当前画布顺序输出。排序结果随简历一起保存在本机数据库，下次进入仍保持。

### 简历生成：信息自定义

在 **基本信息** 编辑区新增「自定义信息项」能力。点击 **添加自定义项** 可新增一组标签与内容输入（例如 GitHub、个人网站、作品集地址、证书链接等），并可随时删除。预览区会把这些条目与预设字段统一渲染；当标签或内容为空时，该项不会显示，避免脏数据进入成品简历。

### 专项面试：阶段与流程

1. 在 **岗位库** 中点击目标岗位卡片，进入该岗位的面试工作台（二级页）。
2. 页面上方选择面试阶段：**一面（基础/项目）**、**二面（深度/策略）**、**HR 面（素质/文化）**、**自定义**。同一岗位会记住你上次停留的阶段（保存在本机浏览器）。
3. 选好阶段后，在右侧选题或空题库时点击 **开始模拟（3 题）**，AI 会按当前阶段的侧重点生成题目；请求中的用户消息仍包含该岗位的 **JD** 与 **简历/经历摘要**，与系统提示中的阶段策略组合使用。

**各阶段 AI 模拟侧重点简述：**

- **一面**：简历与项目细节核实、专业基础、技术方案落地（如数据清洗、训练与评测流程、实现思路等）。
- **二面**：产品设计与技术取舍、指标体系与效果评估、复杂场景下的逻辑推演与决策。
- **HR 面**：职业动机与稳定性、团队协作与沟通案例（STAR）、压力与价值观类情境。

**自定义模块：** 切换到 **自定义** 后，页面会出现可编辑区域，内容与 **设置 → Prompt 管理** 中的「专项面试 · 自定义阶段（系统提示主体）」一致。你可在此修改侧重并点击 **保存到 Prompt 设置**，再使用 **开始模拟**；未保存的编辑在点击「开始模拟」时也会参与当次出题（空编辑区则使用设置中的已保存文案或内置默认）。

### 专项面试：题库分类（备战维度）

每道题目除 AI / 面经使用的「题型」标签（基础能力、项目深挖、行为面试）外，另有 **备战分类** 字段，取值四选一，用于筛选与列表旁的小标签：

- **通用**：如自我介绍、优缺点等泛用问题。
- **业务**：产品逻辑、行业与商业理解等。
- **技术**：原理与工程实现（如 LLM、SFT、代码与系统等）。
- **行为**：压力应对、团队协作、冲突处理等软性情境。

在题目详情区可修改 **备战分类**；「手动新增问题」弹窗中也可指定。题库导航顶部下拉框可按上述四类筛选列表。旧数据若无该字段，会按原题型自动映射（例如「行为面试」题型默认为「行为」维度）。

### 专项面试：拖拽至「当前阶段题库」

1. 进入某一岗位的面试工作台后，先在上方 **选择面试阶段**（如一面、二面、HR、自定义）。
2. 在左侧 **题库导航** 中，按住题目左侧 **竖点手柄**，将题目拖入右侧 **当前阶段题库** 区域内的虚线框。
3. 松手后，该题会加入 **当前选中阶段** 的备战列表；数据写入该岗位在 IndexedDB 中的记录，刷新页面后仍存在。
4. 切换阶段时，右侧列表会切换为对应阶段已归流的题目（同一道题可分别加入不同阶段，各阶段列表独立）。
5. 在「当前阶段题库」中点击 **垃圾桶** 仅从本阶段列表移除，**不会**删除全局题库中的题目。

### 专项面试：收起侧栏

**题库导航** 与 **当前阶段题库** 标题栏旁均有收起按钮；收起后中间主编辑区横向占满剩余空间，便于沉浸式写稿。两侧可分别点窄条按钮再次展开。显隐状态保存在本机 localStorage，刷新后保持。

### 专项面试：利用面经做发散模拟

1. 通过 **面经深度解析** 或 **手动新增问题**，将真实面试题写入本题库中「面经 / 手录」分组（类型为用户采集）。
2. 点击 **开始模拟（3 题）** 时，若当前岗位下至少存在一道非空的手录/面经题，系统会自动进入 **面经发散模式**：请求中会把这些题目的原文（以当前题库中的最新文案为准）作为第一优先级的上下文，其次拼接当前所选 **面试阶段** 的考察侧重，再附上 **JD** 与 **个人信息库** 经历摘要。
3. AI 在系统提示词约束下 **禁止复述** 面经原句，而应以面经考点为锚，与你的简历项目、目标岗位场景做 **交叉追问、原理钻取或案例变形**；模型温度在发散模式下提高至约 **0.7**，以增加提问的多样性与启发性。
4. 若当前没有任何手录/面经题，则自动回退为仅基于 **JD + 简历 + 当前阶段** 的标准三道题模式，行为与此前一致。
5. 发散模式生成的新题在列表中以 **「基于面经发散」** 标签展示；编辑左侧手录题后，无需额外保存步骤，下次点击「开始模拟」即使用更新后的面经文本。

## 问题反馈

如遇任何问题或有功能建议，请通过飞书表单反馈：  
[问题与建议反馈](https://xcnlrv02xcir.feishu.cn/share/base/form/shrcnWGXuESqLkSs72rhyiSKCEk)

（你也可以在仓库 README 末尾查看相同反馈入口说明。）
`.trim()

const markdownComponents = {
  a: ({ href, children, title, className }) => {
    const isPlaceholder = href === '#' || !href
    return (
      <a
        href={isPlaceholder ? '#' : href}
        title={title}
        className={className}
        target={isPlaceholder ? undefined : '_blank'}
        rel={isPlaceholder ? undefined : 'noreferrer noopener'}
        onClick={isPlaceholder ? (e) => e.preventDefault() : undefined}
      >
        {children}
      </a>
    )
  },
}

/**
 * @param {{ open: boolean; onClose: () => void }} props
 */
export function GuideModal({ open, onClose }) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={`fixed ${MAIN_CONTENT_OVERLAY_BOX} z-[120] flex items-center justify-center p-4`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]"
        aria-label="关闭"
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(88vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl ring-1 ring-slate-100/80">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold tracking-tight text-slate-800">
            使用说明
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            aria-label="关闭"
          >
            <X className="size-[18px]" strokeWidth={1.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="guide-md prose prose-sm max-w-none prose-slate prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mb-3 prose-h2:mt-6 prose-h2:text-base prose-h2:first:mt-0 prose-p:leading-relaxed prose-li:leading-relaxed prose-table:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {GUIDE_MARKDOWN}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
