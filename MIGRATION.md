# 迁移说明：Taro 4 → uni-app x

源工程：`../atlas-admin-app`（Taro 4.2 + Vue 3 + NutUI + alova）
目标工程：`atlas-admin-uni-x`（uni-app x / Vue 3 / UTS）

## 一、为什么不是「改配置就能跑」

uni-app x 与 Taro 的差异不止是构建工具，运行时模型也不同：

| 维度 | Taro | uni-app x |
| --- | --- | --- |
| 语言 | TypeScript（跑在 JS 引擎） | UTS（编译到 Kotlin / Swift / JS） |
| 页面文件 | `.vue` | `.uvue`（脚本段 `lang="uts"`） |
| 布局 | 浏览器 box / flex 全支持 | 只支持 flex + 绝对定位；默认 `flex-direction: column`；样式不继承 |
| 选择器 | 全部 CSS 选择器 | 只支持 class 选择器（不支持标签、`#id`、后代、兄弟、伪类） |
| 样式作用域 | CSS Modules / `scoped` | 无 CSS Modules、无 `scoped`（改用样式隔离 2.0） |
| 状态管理 | pinia | 官方推荐「独立 uts 文件 + reactive 全局变量」 |
| 请求 | 任意 JS 库（alova/axios） | `uni.request`（第三方 JS 库在原生端不可用） |
| 组件库 | NutUI（taro 版） | 无第三方 Vue 组件库，用内置组件 + 自绘 |

因此这次迁移是**逐文件重写 + 机械转换脚本**的组合。

## 二、做了什么

### 1. 结构与配置

- `app.config.ts` 的 `pages` + `subPackages` → `pages.json`（扁平化，22 个页面）
- 8 个 `*.config.ts` 的 `navigationBarTitleText` → `pages.json` 的 `style`
- 全部页面统一 `navigationStyle: custom`（原 Taro 版仅 H5 自定义导航栏，现在三端都由 `PageNavbar` 自绘，表现一致）
- tabBar 图标沿用 `static/images/tab/*.png`
- `TARO_APP_*` 环境变量 → `constants/config.uts` 里的显式配置对象（uni-app x 无编译期 DefinePlugin）

### 2. API 替换

| Taro | uni-app x |
| --- | --- |
| `Taro.navigateTo / reLaunch / switchTab / redirectTo / navigateBack` | `uni.*` 同名 |
| `Taro.showModal / showLoading / hideLoading / previewImage / chooseImage / downloadFile / openDocument` | `uni.*` 同名 |
| `Taro.getStorageSync / setStorageSync / removeStorageSync` | `uni.*` 同名 |
| `Taro.getSystemInfoSync` | `uni.getSystemInfoSync`（封装为 `utils/platform.uts#getSystemInfoLite`） |
| `Taro.getEnv() / ENV_TYPE` | 条件编译 `getEnvName()` + `ENV_TYPE` |
| `Taro.getCurrentInstance().router` | `getCurrentPages()`（封装为 `utils/router.uts#getCurrentPageInfo`） |
| `Taro.login()` | `uni.login({ provider: 'weixin' })` |
| `Taro.getUpdateManager()` | `utils/update.uts#getUpdateManager`（非微信小程序返回空实现） |
| `useDidShow / useDidHide` | `onPageShow / onPageHide`（注意不是 `onShow`） |
| `useLoad / useReachBottom / usePullDownRefresh` | `onLoad / onReachBottom / onPullDownRefresh` |

> uni-app x 的组合式 API 里 `ref/computed/watch` 与页面生命周期都自动引入，脚本里保留的 `import { ref } from 'vue'` 是显式写法，两者等价。

### 3. 请求层重写

Taro 版用 alova：`request.Post<T>(url, data)` 返回一个**惰性 method**，调用方随后 `method.meta = {...}`，`await` 时才发请求。

UTS 没有 thenable 惰性对象，因此：

```ts
// 之前
const method = request.Post<ServiceResult<X>>(url, data)
method.meta = { withToken: false, showErr: false }
return method

// 现在
return http.post<ServiceResult<X>>(url, data, { withToken: false, showErr: false })
```

对外契约不变（仍是 `Promise<ServiceResult<T>>`），**页面层 0 改动**。
31 个接口文件的转换由 `scripts/migrate-api.mjs` 完成（含括号/大括号配对扫描，不是正则硬替换）。

请求层 `api/http/index.uts` 实现：

- `appConfig.useMock = true` → 走 `mock/engine.uts`，不发起真实请求（保留 180ms 模拟延迟）
- 为 `false` → 走 `uni.request`，含 token 注入、业务码解包、HTTP 状态文案、token 失效回调

### 4. 状态管理

`pinia` 的四个 store 改成「class + reactive 单例」：

```ts
class AuthStore { status: AuthStatus = 'loading'; async init() { ... } }
export const authStore = reactive(new AuthStore()) as AuthStore
export function useAuthStore(): AuthStore { return authStore }
```

调用方写法完全不变（`const authStore = useAuthStore(); authStore.status`），`isLoggedIn / isAdmin` 用 class getter 保留。

### 5. 样式收敛为 ucss 子集

这是工作量最大的一块（原工程 52 个 SCSS、7.6k 行）。转换规则：

1. **嵌套展平**：`.a { .b {...} }` → `.a .b {...}`（后代选择器），`&--mod` → `.a--mod`
2. **app 端不支持的规则**包进条件编译：`/* #ifdef WEB */ ... /* #endif */`
   - 命中 100 处，主要是 `&:active` 按压态（49 处）、伪元素、兄弟选择器、后代选择器
3. **标签选择器**（原 `reset.scss` 里的 `page / view / text / image` 等）全部丢弃，改为 App.uvue 中的公共类
4. **CSS Modules 去掉**：`styles['card-title']` → `'card-title'`，`styles[`icon--${type}`]` → `` `icon--${type}` ``
5. **样式内联**：`xxx.module.scss` → 合并进同名 `.uvue` 的 `<style lang="scss">`
6. SCSS 变量（原先由 Taro `sass.resource` 全局注入）→ 移到 `uni.scss`（uni-app x 会自动注入每个 style 编译单元）

### 6. 组件替换

| NutUI | 替代 |
| --- | --- |
| `nut-button` | `<view class="sp-btn ..."><text class="sp-btn-text">` |
| `nut-input` | `<input class="sp-input" />` |
| `nut-popup` | `.sp-mask` + `.sp-sheet` 自绘弹层 |
| `nut-avatar` | `<image mode="aspectFill" />` |
| `nut-switch` | 原生 `<switch :checked @change>` |
| `nut-progress` | 两层 view 画的进度条 |
| `nut-skeleton` | 三行灰条自绘骨架屏 |
| `nut-navbar` | `PageNavbar` 自绘（所有端统一） |
| `nut-grid` | flex 行 |
| `@nutui/icons-vue-taro` | unicode 字形（`›` `✓` `✕` `＋` `📄` `▶` `👤`） |

> app 端不支持伪元素，图标字体方案不可用，所以统一走 unicode 直显。

## 三、已知限制（务必阅读）

### 0. 语言后缀：统一用 .ts 而不是 .uts

HBuilderX 5.34 的编译器横幅是「当前 uvue/vue 文件默认 script lang：ts」，实测把脚本写成 `.uts` 后
H5 / 小程序（VDOM 模式）编译链会把它当普通 JS 解析，直接报 `Expected '{', got 'type'`。
因此迁移产物统一用 **`.ts`**（含 `main.ts`），`.uvue` 的 `<script lang="ts">`。
需要 UTS 专属类型（UTSJSONObject、原生 API 映射）时再改回 `.uts` 走 App 蒸汽模式编译。

### 1. 验证范围

**已完成**：

- HBuilderX 5.34 内置编译器识别工程为 uni-app x，`pages.json` / `manifest.json` / `App.uvue` / `main.ts` 正常加载
- 应用外壳编译：H5 与 mp-weixin 均 `DONE Build complete`
- 语法级：`tsc --noEmit` 检查 85 个 `.ts` + 51 个 `.uvue` 的 script 块 → 0 个语法错误（TS1xxx）
- 模板级：`@vue/compiler-sfc` parse + compileTemplate 检查 47 个 `.uvue` → 0 个错误

**未完成**：页面级 uni-app x 编译。原因：HBuilderX 的 CLI 依赖 `/bin/ps` 做进程检测，本机环境对该二进制做了拦截；
手工用 `uniapp-cli-vite` 的 `uni.js` 调用只能编译到「应用外壳」（3 个模块，不含 pages 路由表），
即使最小工程复现同样现象，判断是缺少 IDE 侧的页面流水线，而非工程本身问题。
用 HBuilderX / HBuilderV 图形界面打开工程即可补上这一步。

### 1.1 静态体检

`scripts/check-unix.mjs`：

- 残留 `Taro` / `@tarojs` / `@nutui` / `styles.` 引用：0
- import 断链：0
- `pages.json` 页面未落地：0
- 模板标签配对：0 异常
- `defineProps` 类型式声明：0（已全部改为运行时声明，uni-app x 必需）

首次在 HBuilderX 打开时预计仍需按控制台报错做一轮类型收敛，见下一条。

### 2. 动态对象在原生端需要强类型化

`mock/datasets.uts`、`mock/engine.uts`、`api/**` 里用了较多 `Record<string, any>` 与动态下标。
UTS 编译到 Web / 微信小程序（JS 引擎）没问题；编译到 **Android / iOS 原生（Kotlin）** 时，UTS 要求更严格的类型，
这些位置可能需要改用 `UTSJSONObject` 或显式 class。这是本工程与「原生端 100% 可编译」之间的主要差距。

### 3. 按功能降级的地方

| 功能 | 原实现 | 现实现 | 影响 |
| --- | --- | --- | --- |
| 文件预览 | `@file-viewer`（PDF/Office 渲染，依赖 DOM + Worker + WASM） | `uni.openDocument` / 浏览器新窗口 | 无内嵌多页渲染与工具栏 |
| 地图 | OpenLayers（`utils/map.ts`，实际未被页面引用） | 未迁移 | 无影响（原工程也是死代码） |
| 人脸活体 | H5 端 onnxruntime-web（WASM） | 仅保留相机采集，活体判定走服务端 | H5 端失去静默活体 |
| 密码 AES 加密 | crypto-js AES/CBC | `utils/crypto.uts` 原样返回（`AES_ENABLED = false`） | 演示版无后端校验，无影响；对接真实后端前需换 UTS 版 AES 插件或改后端收明文 |
| 按压态 | `:active` | 仅 Web 生效（`#ifdef WEB`） | App / 小程序需改用 `hover-class` 才有按下反馈 |

### 4. CSS 能力差异

- `gap` 不在 uni-app x 已声明支持的属性清单内，App 端可能不生效（Web / 小程序正常），受影响的是 flex 间距
- `z-index` 仅在**同层兄弟节点**之间生效，自绘弹层（`.sp-mask`）依赖 fixed 定位 + 页面顶层放置
- 样式不继承：文本样式必须写在 `<text>` 上（原工程里写在 `view` 上的 `color/font-size` 已逐步下移到 `text`，但**未逐一核对**）

## 四、后续 TODO

1. 在 HBuilderX 里跑通 Web → 微信小程序 → Android 三个端，逐个修编译错误
2. `mock/` 与 `api/` 的 `Record<string, any>` 收敛为显式类型（原生端必需）
3. `.sp-page--with-bar` / `.sp-page--with-fab` 与页面自身 `padding` 的覆盖关系需要真机核对
4. 按压态改为 `hover-class`，恢复 App / 小程序的点击反馈
5. `gap` 依赖处改为 `margin`，保证 App 端间距正确
6. 补 E2E：原 Playwright 用例（70 条）针对 H5 DOM，可在 Web 端复用，需改选择器前缀
7. 文件预览若要在 Web 端保留完整渲染，可在 `pages/mine/preview/index.uvue` 里用 `<!-- #ifdef WEB -->` 单独挂 `@file-viewer`

## 五、迁移流水线

四步按顺序执行即可从 `../atlas-admin-app/src` 完整重现当前产物：

| 步骤 | 脚本 | 负责 |
| --- | --- | --- |
| 1 | `migrate-from-taro.mjs` | `.vue → .uvue`、生命周期改名、`Taro.* → uni.*`、CSS Modules 去壳、SCSS 展平、样式内联 |
| 2 | `migrate-api.mjs` | alova 惰性 method + `meta` → `http.get/post(url, data, options)`（括号配对扫描，非正则硬替换） |
| 3 | `fix-imports.mjs` | import 路径归一（`@/api/api/` 双前缀、驼峰文件名的 kebab 化、补扩展名） |
| 4 | `post-process.mjs` | 语义改造：`process.env.TARO_ENV` → 平台函数、命名空间类型扁平化 + 自动补 `type import`、`defineProps<{}>()` → 运行时声明、NutUI 全量替换、空标签自闭合、定点修正 |
| 5 | `to-ts.mjs` | `.uts → .ts` + `lang="uts" → lang="ts"` + `index.html` 入口（见「0. 语言后缀」） |

`scripts/check-unix.mjs` 是回归闸门，当前基线全 0（残留引用 / 断链 import / 未落地页面 / 类型式 props）。

`scripts/check-exports.mjs` 专门治一类隐蔽问题：原工程用 barrel（`components/X/index.ts`、`constants/auth.ts`）
聚合导出，迁移时被拍平成具体文件，容易出现「导入了但目标文件没有这个导出」——运行时报
`does not provide an export named 'XXX'`。首个真实案例是登录页的 `PASSWORD_LOGIN`
（原本在 `constants/auth.ts`，迁移时被并到 `constants/config.ts` 却没补上导出）。

> 第 4 步是**幂等**的，可以反复执行；只有第 1 步会重建 `pages/` 与 `components/`，
> 因此改完代码后若又要从源工程同步，务必按 1→4 全跑一遍。
