# Xorcism

**Xorcism** 是一个适用于 Chrome 114+ 的 X（Twitter）批量拉黑辅助扩展。它让你在当前页面上选择可见账号，在侧边栏里检查去重后的有限队列，然后通过 X 自己的界面，逐个完成拉黑。

这个项目存在的原因很简单：那些反复出现的色情引流、诈骗、营销和机器人账号，不该无限占用你的注意力。

> [!IMPORTANT]
> 点击 **Block selected** 后，队列会立即开始。Xorcism 自己不会再弹出额外确认窗口；但在处理每个账号时，它仍然会使用 X 页面上原本可见的 Block 操作和 X 自己的确认按钮。

> [!WARNING]
> X 经常修改网页结构，因此页面选择器可能会在没有预警的情况下失效。建议先从少量账号开始。连续执行大量操作时，X 也可能触发验证、限速或账号限制。

Xorcism 是独立项目，与 X Corp. 没有隶属、合作、认可或赞助关系。

## v0.3 可以做什么

- 只在 `x.com` 和 `twitter.com` 上运行。
- 点击浏览器工具栏图标后，以常驻 Chrome 侧边栏形式打开。
- 可以点击单个账号卡片，也可以拖动选择框一次选中多个卡片。
- 拖动到页面顶部或底部附近时自动滚动。
- 支持当前页面可见的推文卡片和 People 搜索结果卡片。
- 自动提取账号 handle 并去重。
- 执行前在侧边栏展示可检查的账号列表。
- 只有用户主动点击 **Block selected** 后，才会启动有限队列。
- 优先使用原页面上的账号操作菜单，以提高速度。
- 如果 People 搜索结果里没有可用的 Block 菜单，会复用一个非活动状态的个人主页标签页作为备用方式。
- 通过 X 页面中可见的控件逐个拉黑账号。
- 完成有限队列后自动停止。
- 支持手动停止；当前账号处理完成后终止后续队列。
- 对跳过或失败的账号，显示具体失败阶段。
- 不发送分析数据，也不会请求开发者服务器或第三方分析服务。

## 它刻意不会做什么

- 不读取密码、Cookie、登录令牌或私信。
- 不调用未公开的 X 接口。
- 不无限抓取页面，也不会在后台自动发现账号。
- 不自动判断某个账号是不是机器人。
- 不会在没有明确用户操作的情况下运行。
- 不绕过 X 正常的 Block 界面，也不使用隐藏的破坏性接口。

这些限制是产品设计选择，不是尚未完成的功能。

## 安装未打包版本

本仓库不需要构建步骤。

1. 下载或克隆本仓库。
2. 打开 Chrome 114 或更高版本。
3. 访问 `chrome://extensions`。
4. 开启右上角的 **Developer mode / 开发者模式**。
5. 点击 **Load unpacked / 加载已解压的扩展程序**。
6. 选择解压后的 `Xorcism-v0.3.0 `文件夹，也就是直接包含 `manifest.json `的文件夹。
7. 将 Xorcism 固定到浏览器工具栏。
8. 如果安装前已经打开了 X 页面，请重新加载该标签页。

更新未打包版本时，替换旧文件，在扩展管理页的 Xorcism 卡片上点击 **Reload / 重新加载**，然后重新加载 X 标签页。

## 使用方法

1. 打开一个包含可见推文或 People 搜索结果的 X 页面。
2. 点击 Xorcism 工具栏图标，打开侧边栏。
3. 点击 **Select accounts**。
4. 选择账号：
   - 点击卡片，切换单个账号的选中状态；或
   - 按住并拖动选择框，一次框选多个账号。
5. 选择完成后按 `Esc`，或点击侧边栏里的 **Finish selection**。
6. 仔细检查已经去重的账号列表。
7. 点击 **Block selected**，队列会立即开始。
8. 在队列完成前，请保持原始 X 标签页打开。

对于带有操作菜单的推文卡片，Xorcism 会直接在原页面执行拉黑。对于只显示 Follow 按钮的 People 搜索结果，Xorcism 会复用一个非活动的 X 个人主页标签页，并在完成后关闭它。

## 项目结构

```text
Xorcism/
├─ manifest.json
├─ assets/icons/
├─ src/
│  ├─ background/
│  │  └─ service-worker.js
│  ├─ shared/
│  │  ├─ namespace.js
│  │  ├─ messages.js
│  │  ├─ handle-utils.js
│  │  └─ geometry-utils.js
│  ├─ content/
│  │  ├─ index.js
│  │  ├─ selection-controller.js
│  │  ├─ x-adapter.js
│  │  └─ styles.css
│  └─ popup/
│     ├─ popup.html
│     ├─ popup.css
│     └─ popup.js
├─ scripts/
├─ tests/
├─ docs/
├─ PRIVACY.md
├─ SECURITY.md
├─ CONTRIBUTING.md
└─ LICENSE
```

`src/popup/` 目录保留了早期命名，但其中的 HTML 现在实际显示在 Chrome 侧边栏中。

最重要的平台适配边界是 `src/content/x-adapter.js`。产品逻辑不应直接依赖 X 当前的 DOM 结构。当 X 修改页面时，应优先检查并尽量只修复这个适配文件。

后台 service worker 负责管理有限队列。它会先尝试在来源标签页中直接执行操作；如果该卡片无法安全提供 Block 操作，就会改用临时个人主页标签页。

完整设计说明见 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。

## Windows 和 VS Code 开发

在仓库目录打开 PowerShell：

```powershell
code .
npm test
npm run check
```

项目没有运行时依赖，也没有打包器。修改源码后，在 `chrome://extensions` 的扩展卡片上点击 **Reload**。

修改 content script 后，需要同时重新加载扩展和 X 标签页。修改 service worker 后，可以通过扩展卡片上的 **service worker** 链接检查控制台。

## 测试

自动化测试覆盖 handle 解析、框选几何计算、manifest 资源引用和 JavaScript 语法：

```powershell
npm run check
```

浏览器手动测试清单见 [`docs/MANUAL_TESTING.md`](docs/MANUAL_TESTING.md)。失败阶段和控制台排查说明见 [`docs/DEBUGGING.md`](docs/DEBUGGING.md)。

## 已知限制

- X 的 DOM 选择器不是官方接口，天然容易失效。
- 不同语言界面下的操作识别还没有完全覆盖。
- 处理 People 搜索结果时，标签栏中可能短暂出现一个临时个人主页标签页。
- 选择结果只保存在当前会话中，来源页面重新加载后会消失。
- 没有撤销队列；需要取消拉黑时，必须通过 X 自己操作。
- X 可能对重复操作进行验证、限速或限制。
- 无障碍支持和纯键盘框选仍需改进。
- 当前正式支持 Chrome；其他 Chromium 浏览器尚未纳入发布测试范围。

## 发布历史与计划

### v0.3 — 侧边栏工作流

- [x] 常驻侧边栏控制与进度显示
- [x] 点击选择账号
- [x] 拖动框选多个账号
- [x] 框选时边缘自动滚动
- [x] Handle 去重
- [x] 在推文卡片上直接拉黑
- [x] People 搜索结果使用个人主页标签页备用方案
- [x] 队列进度在当前会话中保留
- [x] 分阶段错误诊断
- [x] 停止控制
- [x] 无遥测、无远程可执行代码
- [x] 点击开始后不再显示额外的 Xorcism 确认弹窗

### 计划中的稳定性改进

- [ ] 更完善的选择器诊断导出
- [ ] 支持更多界面语言
- [ ] 对 X 临时错误增加重试策略
- [ ] 可配置的操作间隔
- [ ] 更完整的键盘操作
- [ ] 可选的强制批次上限

未来可能加入用于提示候选账号的分类器，但它永远不应在没有用户确认的情况下决定拉黑谁。

## 平台与账号安全

Xorcism 只会在用户自己已登录的会话中，自动执行页面上可见的界面操作。平台规则和页面结构都可能变化，用户仍需对自己账号上执行的操作负责。

建议保持较小批次。不要使用 Xorcism 骚扰他人、操纵平台活动，或操作不属于你、也不受你控制的账号。

## 隐私

Xorcism 不会收集或向开发者传输用户数据。详情见 [`PRIVACY.md`](PRIVACY.md)。

## 参与贡献

欢迎提交 issue 和 pull request。请先阅读 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

## 许可证

MIT，见 [`LICENSE`](LICENSE)。

---

# English

**Xorcism** is a Chrome 114+ extension for selecting visible accounts on X, reviewing the deduplicated list in a side panel, and blocking that finite user-chosen queue through X's own interface.

The project exists for one reason: repeated spam, scam, porn-bait, promotional, and bot accounts should not get unlimited access to your attention.

> [!IMPORTANT]
> Clicking **Block selected** starts the queue immediately. Xorcism does not show an additional confirmation dialog of its own. It then uses X's visible Block controls, including X's confirmation control, for each selected account.

> [!WARNING]
> X changes its web interface frequently, so selectors can break without warning. Start with a small batch. X may also challenge, throttle, or restrict repetitive account actions.

Xorcism is an independent project and is not affiliated with, endorsed by, or sponsored by X Corp.

## What v0.3 does

- Runs only on `x.com` and `twitter.com`.
- Opens as a persistent Chrome side panel from the toolbar icon.
- Lets the user click one account card or drag a selection rectangle across many cards.
- Auto-scrolls while dragging near the top or bottom edge of the page.
- Supports visible post cards and People-search result cards.
- Extracts and deduplicates account handles.
- Shows a reviewable handle list before execution.
- Starts a finite queue only when the user presses **Block selected**.
- Tries the source-page action menu first for speed.
- Falls back to one reusable inactive profile tab when a result card has no Block menu.
- Blocks accounts one at a time through X's visible controls.
- Stops automatically after the finite queue is complete.
- Supports a manual stop after the current account.
- Reports the exact failure stage for skipped and failed accounts.
- Sends no analytics and makes no developer-server or third-party analytics requests.

## What it deliberately does not do

- It does not read passwords, cookies, authentication tokens, or private messages.
- It does not call undocumented X endpoints.
- It does not crawl infinitely or discover accounts in the background.
- It does not classify an account as a bot.
- It does not run without a clear user action.
- It does not suppress X's normal Block interface or use hidden destructive APIs.

Those boundaries are product decisions, not missing features.

## Install the unpacked extension

This repository has no build step.

1. Download or clone the repository.
2. Open Chrome 114 or newer.
3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Choose **Load unpacked**.
6. Select the repository root — the folder containing `manifest.json`.
7. Pin Xorcism to the browser toolbar.
8. Reload any X tab that was already open before the extension was installed.

When upgrading an unpacked copy, replace the files, press **Reload** on the Xorcism extension card, and reload the X tab.

## Use it

1. Open a page on X containing visible posts or People-search results.
2. Click the Xorcism toolbar icon to open the side panel.
3. Choose **Select accounts**.
4. Either:
   - click a card to toggle one account; or
   - press and drag a rectangle across multiple cards.
5. Press `Esc` when selection is complete, or choose **Finish selection** in the side panel.
6. Review the deduplicated handle list carefully.
7. Choose **Block selected**. The queue begins immediately.
8. Keep the original X tab open until the queue finishes.

For post cards with an action menu, Xorcism blocks directly on the source page. For People-search cards that only expose a Follow button, Xorcism reuses one inactive X profile tab and closes it when finished.

## Architecture

```text
Xorcism/
├─ manifest.json
├─ assets/icons/
├─ src/
│  ├─ background/
│  │  └─ service-worker.js
│  ├─ shared/
│  │  ├─ namespace.js
│  │  ├─ messages.js
│  │  ├─ handle-utils.js
│  │  └─ geometry-utils.js
│  ├─ content/
│  │  ├─ index.js
│  │  ├─ selection-controller.js
│  │  ├─ x-adapter.js
│  │  └─ styles.css
│  └─ popup/
│     ├─ popup.html
│     ├─ popup.css
│     └─ popup.js
├─ scripts/
├─ tests/
├─ docs/
├─ PRIVACY.md
├─ SECURITY.md
├─ CONTRIBUTING.md
└─ LICENSE
```

The `src/popup/` directory retains its original name, but its HTML is now displayed as a Chrome side panel.

The important platform boundary is `src/content/x-adapter.js`. Product logic should not depend directly on X's current DOM structure. When X changes its interface, the adapter should be the first and ideally only file that needs repair.

The background service worker owns the finite queue. It first requests an inline action from the source tab. When that card cannot expose a safe Block action, it falls back to a temporary profile tab.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design.

## Development on Windows and VS Code

Open PowerShell in the repository:

```powershell
code .
npm test
npm run check
```

There are no runtime dependencies and no bundler. Edit the source files, then press **Reload** on the extension card in `chrome://extensions`.

For content-script changes, reload both the extension and the X tab. For service-worker changes, use the **service worker** link on the extension card to inspect its console.

## Testing

Automated tests cover handle parsing, marquee geometry, manifest resource references, and JavaScript syntax:

```powershell
npm run check
```

Manual browser checks are listed in [`docs/MANUAL_TESTING.md`](docs/MANUAL_TESTING.md). Failure-stage and console instructions are in [`docs/DEBUGGING.md`](docs/DEBUGGING.md).

## Known limitations

- X DOM selectors are unofficial and inherently fragile.
- Locale-independent action detection is not complete.
- A temporary inactive profile tab may briefly appear in the tab strip for People-search results.
- Selection is session-only and disappears when the source page reloads.
- There is no undo queue. Unblocking must be done through X.
- X may challenge, throttle, or restrict repetitive account actions.
- Accessibility and keyboard-only marquee selection need further work.
- Chrome is the supported browser. Other Chromium browsers are not currently part of the release test matrix.

## Release history and roadmap

### v0.3 — side-panel workflow

- [x] Persistent side-panel controls and progress
- [x] Click selection
- [x] Drag-box multi-selection
- [x] Edge auto-scroll during drag selection
- [x] Handle deduplication
- [x] Inline blocking for post cards
- [x] Profile-tab fallback for People search
- [x] Session-persisted queue progress
- [x] Stage-specific diagnostics
- [x] Stop control
- [x] No telemetry or remote executable code
- [x] Streamlined queue start without an extra Xorcism confirmation dialog

### Planned resilience work

- [ ] Better selector diagnostics export
- [ ] More locale coverage
- [ ] Retry policy for transient X failures
- [ ] Configurable post-action cooldown
- [ ] Keyboard-first selection
- [ ] Optional hard batch limit

A future classifier may suggest candidates. It should never silently decide who gets blocked.

## Platform and account safety

Xorcism automates visible interface interactions on the user's own logged-in session. Platform rules and interfaces can change, and users remain responsible for actions taken on their accounts.

Keep batches small. Do not use Xorcism to harass users, manipulate platform activity, or operate accounts you do not own or control.

## Privacy

Xorcism does not collect or transmit user data to the developer. See [`PRIVACY.md`](PRIVACY.md).

## Contributing

Issues and pull requests are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) first.

## License

MIT — see [`LICENSE`](LICENSE).
