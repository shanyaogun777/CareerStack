/**
 * 将 Boss 页采集结果转发到已打开的 CareerStack 本地页签；若无则暂存 storage 并打开 /jobs。
 */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'BOSS_JD_TO_APP') return
  const payload = msg.payload

  ;(async () => {
    try {
      const tabs = await chrome.tabs.query({})
      const appTab = tabs.find(
        (t) => t.url && /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)(:\d+)?\//.test(t.url),
      )

      if (appTab?.id != null) {
        try {
          await chrome.tabs.sendMessage(appTab.id, { type: 'FORWARD_TO_PAGE', payload })
        } catch {
          await chrome.storage.local.set({ pendingCareerStackImport: payload })
        }
      } else {
        await chrome.storage.local.set({ pendingCareerStackImport: payload })
        await chrome.tabs.create({ url: 'http://localhost:5173/jobs' })
      }
      sendResponse({ ok: true })
    } catch (e) {
      sendResponse({ ok: false, error: String(e) })
    }
  })()

  return true
})
