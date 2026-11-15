# Atlas 工作台 · uni-app x 版（atlas-admin-uni-x）

Atlas 工作台移动端演示应用的 **uni-app x 重写版**，由 `atlas-admin-app`（Taro 4 + Vue 3 + NutUI）迁移而来。

- 目标端：Web（H5）、微信小程序、Android / iOS 原生（蒸汽模式）
- 技术栈：uni-app x（Vue 3 + UTS）
- 数据：无后端，全部由本地 mock 引擎生成（`mock/engine.uts`）

## 快速开始

用 HBuilderX（4.25 以上，推荐 5.x）打开本目录即可运行：

| 目标 | 操作 |
| --- | --- |
| Web | 运行 → 运行到浏览器 |
| 微信小程序 | 运行 → 运行到小程序模拟器 → 微信开发者工具（需配置 `manifest.json` 里的 `mp-weixin.appid`） |
| Android / iOS | 运行 → 运行到手机或模拟器 |

> 本工程是 HBuilderX 原生工程结构（`pages.json` / `manifest.json` / `App.uvue` / `main.uts`），不依赖 npm 构建链。
> `package.json` 里只保留了迁移/体检脚本，方便重复执行。

## 目录结构

```
atlas-admin-uni-x/
├── App.uvue                # 应用入口：onLaunch 初始化 + 全局样式（sp-* 公共类）
├── main.uts                # createSSRApp 入口
├── pages.json              # 页面路由 / tabBar / easycom
├── manifest.json           # 应用配置（含 "uni-app-x": {} 标识）
├── uni.scss                # 全局 SCSS 变量（自动注入每个 style 编译单元）
├── static/images/          # tabBar 图标等静态资源
├── pages/                  # 22 个页面（.uvue，样式内联在 <style lang="scss">）
│   ├── index/              # 工作台首页（含 MenuGrid / TodoList / UserCard 子组件）
│   ├── login/              # 登录（验证码 / 密码）
│   ├── checkin/            # 打卡 / 记录 / 统计
│   ├── apply/              # 请假申请 / 我的申请 / 详情
│   ├── contact/  team/     # 通讯录 / 成员管理
│   ├── rules/              # 考勤规则列表 / 详情 / 编辑
│   ├── board/              # 数据看板
│   ├── mine/               # 我的 / 个人信息 / 修改密码 / 人脸 / 文件预览
│   └── user/message/       # 消息中心
├── components/             # 15 个业务组件（kebab-case 目录 + 同名 .uvue）
├── api/                    # 请求层 + 全部接口定义
│   ├── http/index.uts      # uni.request 封装（mock / 真实请求二选一）
│   └── *.uts               # 按领域拆分的接口模块
├── store/                  # 全局状态（reactive 单例，替代 pinia）
├── composables/            # 组合式 hooks（列表分页、枚举、权限、文件预览、更新检查）
├── mock/                   # 本地数据引擎（datasets / dict / engine / random）
├── utils/                  # 存储、路由、平台、token、考勤规则、权限等纯逻辑
├── types/                  # UTS 类型定义（扁平的 Service*/Auth*/FileStorage* 等）
├── styles/theme.uts        # 颜色常量
└── scripts/                # 迁移脚本 + 体检脚本（见下）
```

## 与 Taro 版的对应关系

| Taro 版 | uni-app x 版 |
| --- | --- |
| `src/app.config.ts` + `*.config.ts` | `pages.json` |
| `src/app.ts` | `App.uvue`（`onLaunch`）+ `main.uts` |
| `src/pages/**/index.vue` | `pages/**/index.uvue` |
| `xxx.module.scss` + `styles.xxx` | 同名 `.uvue` 内联 `<style lang="scss">` + 字面类名 |
| `@tarojs/taro` API | `uni.*` API |
| `useDidShow / useLoad / useReachBottom` | `onPageShow / onLoad / onReachBottom`（uni-app x 自动引入） |
| pinia `defineStore` | `store/*.uts` 里的 `reactive(new XStore())` 单例 |
| alova `request.Get/Post` + `method.meta` | `http.get/post(url, data, options)` |
| NutUI 组件 | 原生 `view / text / input / switch` + `App.uvue` 里的 `sp-*` 公共类 |
| CSS Modules / scoped | 全局 class（uni-app x 用样式隔离 2.0，页面/组件样式互不影响） |

## 脚本

迁移流水线（顺序执行，可完整重现当前产物）：

```bash
node scripts/migrate-from-taro.mjs   # 1. 页面/组件机械转换 + SCSS 展平 + 样式内联
node scripts/migrate-api.mjs         # 2. service/api → api（alova method.meta → options 参数）
node scripts/fix-imports.mjs         # 3. import 路径（kebab-case + 扩展名）
node scripts/post-process.mjs        # 4. 语义改造（Taro 环境变量、类型扁平化、NutUI 替换）
node scripts/check-unix.mjs          # 体检：残留 Taro/NutUI/CSS Modules、断链 import、页面落地
node scripts/check-exports.mjs       # 体检：命名导入在目标模块里是否真的存在
```

`check-unix.mjs` 当前基线：**0 残留、0 断链、0 缺失页面、0 类型式 props**；
`check-exports.mjs` 基线：**0 个缺失导出**（这条检查是为 `PASSWORD_LOGIN` 那类问题加的）。

## 已验证的范围

| 项目 | 方式 | 结果 |
| --- | --- | --- |
| 工程识别 | HBuilderX 5.34 内置编译器 | 识别为 `uni-app x`，`pages.json` / `manifest.json` / `App.uvue` / `main.ts` 正常加载 |
| 应用外壳编译 | `uniapp-cli-vite` H5 + mp-weixin | `DONE Build complete`，无报错 |
| 页面脚本语法 | `tsc --noEmit`（85 个 .ts + 51 个 script 块） | 0 个语法错误（TS1xxx） |
| 组件模板 | `@vue/compiler-sfc` parse + compileTemplate（47 个 .uvue） | 0 个错误 |
| 残留引用 | `check-unix.mjs` | 全 0 |

**未验证**：页面级的 uni-app x 编译（`HBuilderX` CLI 依赖 `/bin/ps`，当前环境被系统拦截；手工调用 `uniapp-cli-vite` 只能编译到应用外壳，缺 IDE 的页面流水线）。用 HBuilderX / HBuilderV 图形界面打开本工程即可完成这一步。

## 依赖与语言说明

- 页面脚本与模块统一用 **`.ts`**（HBuilderX 5.28+ uvue/vue 默认脚本语言；`.uts` 在 5.34 的 H5/小程序编译链里会被当普通 JS 解析）。需要写 UTS 专属类型时，改回 `.uts` 并走 App 蒸汽模式编译即可。
- `vite.config.ts` 仅用于命令行编译验证（HBuilderX 图形界面会注入等价配置），其中把 `vue` 指向 `@dcloudio/uni-h5-vue`。
- 样式是 SCSS，需要 `sass`：命令行编译时 `npm i -D sass`；HBuilderX 会提示安装「scss/sass 编译」插件。

`scripts/templates/` 放的是「必须整文件重写」的两个页面/组件（`page-navbar`、文件预览页），
由第 4 步拷贝到位。

## 文档

- [MIGRATION.md](./MIGRATION.md)：迁移细节、平台差异、已知限制与后续 TODO
- `docs/brand/`：Logo、二维码、演示 GIF（沿用 Taro 版素材）
- 原 Taro 版 `docs/screenshots` 未迁移：截图是 Taro 版界面，迁移后不再准确

## 说明

演示数据全部在本地生成，不发起真实网络请求（`constants/config.ts` 的 `appConfig.useMock = true`）。
登录不再限制在微信环境：`appConfig.passwordLogin = true`，浏览器 / App 直接显示账号密码表单，演示账号 `demo` / `123456`（任意密码均可）。
对接真实后端时把它置为 `false`，并配置 `apiUrl` / `apiUrlPrefix` 即可，页面代码无需改动。
