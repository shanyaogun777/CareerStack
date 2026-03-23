/**
 * 通过公开 CORS 代理拉取招聘页 HTML 并粗提正文（用于 AI 解析 JD）。
 * 若代理失败，调用方应提示用户手动粘贴正文。
 */

/**
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function fetchPageTextViaProxy(url) {
  const u = String(url ?? '').trim()
  if (!u) {
    throw new Error('请输入有效链接')
  }
  new URL(u)

  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
  const res = await fetch(proxyUrl, { method: 'GET' })
  if (!res.ok) {
    throw new Error(`拉取失败（${res.status}），请尝试手动粘贴页面文本`)
  }
  const html = await res.text()
  return htmlToPlainText(html).slice(0, 80_000)
}

/**
 * @param {string} html
 */
function htmlToPlainText(html) {
  let t = html
  t = t.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  t = t.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  t = t.replace(/<[^>]+>/g, '\n')
  t = t.replace(/&nbsp;/g, ' ')
  t = t.replace(/&lt;/g, '<')
  t = t.replace(/&gt;/g, '>')
  t = t.replace(/&amp;/g, '&')
  t = t.replace(/\n{3,}/g, '\n\n')
  return t.replace(/[ \t]+\n/g, '\n').trim()
}
