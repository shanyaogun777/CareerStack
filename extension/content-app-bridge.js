/**
 * 在 CareerStack 页面内：接收 background 转发，通过 postMessage 交给 React 应用。
 */
function postImport(payload) {
  window.postMessage(
    {
      source: 'careerstack-extension',
      type: 'JD_IMPORT',
      payload,
    },
    '*',
  )
}

function flushPending() {
  chrome.storage.local.get(['pendingCareerStackImport'], (r) => {
    if (!r.pendingCareerStackImport) return
    postImport(r.pendingCareerStackImport)
    chrome.storage.local.remove('pendingCareerStackImport')
  })
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'FORWARD_TO_PAGE') {
    postImport(msg.payload)
    sendResponse({ ok: true })
  }
  return true
})

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', flushPending)
} else {
  flushPending()
}
setTimeout(flushPending, 600)
