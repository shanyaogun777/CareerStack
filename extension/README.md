# CareerStack Collector（Chrome 扩展雏形）

在 [Boss 直聘](https://www.zhipin.com) 职位详情页点击「发送到 CareerStack」，将当前页的链接、公司与职位名、JD 正文发送到本机已打开的 CareerStack 应用（`http://localhost:5173`），自动打开「添加岗位」抽屉并预填字段。

## 安装（开发者模式）

1. 打开 Chrome → **扩展程序** → 开启「开发者模式」。
2. **加载已解压的扩展程序**，选择本仓库下的 `extension` 目录。
3. 本地启动 CareerStack：`npm run dev`，浏览器打开 `http://localhost:5173/jobs`（或先打开任意本站页面）。
4. 在 Boss 职位页刷新页面，右下角会出现紫色按钮。

## 工作原理

- `content-boss.js`：在 Boss 网抓取 DOM，通过 `runtime.sendMessage` 交给后台。
- `background.js`：查找指向 `localhost` / `127.0.0.1` 的标签页，向其中的 `content-app-bridge.js` 发消息；若没有打开应用，则把数据写入 `chrome.storage.local` 并新开 `http://localhost:5173/jobs`。
- `content-app-bridge.js`：在 CareerStack 页面 `postMessage`，由 `JobsPage` 监听并打开表单。

## 限制与后续

- Boss 页面结构变化时需更新 `content-boss.js` 中的选择器。
- 生产环境若使用非 5173 端口，请同步修改 `background.js` 里 `chrome.tabs.create` 的 URL。
- 跨设备同步需改为服务端或账号体系，本扩展仅作本地开发演示。
