/**
 * Boss 直聘：浮动按钮 + 简单 DOM 抓取（选择器随站点改版可能需调整）。
 */
function scrape() {
  const url = location.href
  const jobName =
    document.querySelector('.job-name') ||
    document.querySelector('.job-title') ||
    document.querySelector('[class*="job-name"]')
  const companyEl =
    document.querySelector('.company-name') ||
    document.querySelector('.job-company .name') ||
    document.querySelector('.name')
  const jdEl =
    document.querySelector('.job-sec-text') ||
    document.querySelector('.job-detail') ||
    document.querySelector('.job-box .job-detail-main')

  const rawJD = jdEl?.innerText?.trim() || document.body.innerText.slice(0, 12000)

  return {
    url,
    rawJD,
    company: companyEl?.textContent?.trim() || '',
    position: jobName?.textContent?.trim() || '',
  }
}

function mount() {
  if (document.getElementById('careerstack-collector-btn')) return

  const btn = document.createElement('button')
  btn.id = 'careerstack-collector-btn'
  btn.type = 'button'
  btn.textContent = '发送到 CareerStack'
  btn.setAttribute(
    'style',
    [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'z-index:2147483647',
      'padding:10px 14px',
      'border-radius:8px',
      'border:none',
      'background:#aa3bff',
      'color:#fff',
      'font-size:13px',
      'font-weight:600',
      'cursor:pointer',
      'box-shadow:0 4px 14px rgba(0,0,0,.2)',
    ].join(';'),
  )

  btn.addEventListener('click', () => {
    const payload = scrape()
    chrome.runtime.sendMessage({ type: 'BOSS_JD_TO_APP', payload }, () => {
      if (chrome.runtime.lastError) {
        window.alert(`发送失败：${chrome.runtime.lastError.message}`)
        return
      }
      const prev = btn.textContent
      btn.textContent = '已发送，请切回 CareerStack'
      setTimeout(() => {
        btn.textContent = prev
      }, 2800)
    })
  })

  document.body.appendChild(btn)
}

if (document.body) mount()
else document.addEventListener('DOMContentLoaded', mount)
