/**
 * atlas-admin-app (Taro 4 + Vue3) → atlas-admin-uni-x (uni-app x) 迁移脚本
 *
 * 只做「可机械判定」的部分，语义改造（NutUI 组件替换、平台 API 分支）
 * 在脚本产出之后人工完成，脚本会把无法判定的位置标注 TODO(unix)。
 *
 * 用法：TARO_SRC=../atlas-admin-app/src node scripts/migrate-from-taro.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC = process.env.TARO_SRC || path.resolve(ROOT, '../atlas-admin-app/src')

const stats = { vue: 0, scss: 0, uts: 0, nut: [], todo: [], dropped: [], webOnly: 0, configs: [] }

const kebab = s => s
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replace(/[\s_]+/g, '-')
  .toLowerCase()

function ensureDir(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
}

function write(p, content) {
  ensureDir(p)
  fs.writeFileSync(p, content)
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory())
      walk(full, out)
    else out.push(full)
  }
  return out
}

// ---------------------------------------------------------------- 组件映射

const COMPONENTS = {
  AuthLayout: 'auth-layout',
  File: 'file',
  FileUpload: 'file-upload',
  PageNavbar: 'page-navbar',
  SpCard: 'sp-card',
  SpEmpty: 'sp-empty',
  SpFaceCamera: 'sp-face-camera',
  SpFilterSelect: 'sp-filter-select',
  SpFormRow: 'sp-form-row',
  SpKvRow: 'sp-kv-row',
  SpListStatus: 'sp-list-status',
  SpSearchBar: 'sp-search-bar',
  SpSliderCaptcha: 'sp-slider-captcha',
  SpToast: 'sp-toast',
  Watermark: 'watermark',
}

/** 从 '@/components/X' 这类 barrel 导入里拆出的「非组件」符号 */
/** 目录名与主组件文件名不一致的情况 */
const MAIN_FILE = { SpSliderCaptcha: 'SliderCaptcha' }

/** 目录名与主组件文件名不一致的情况 */

const BARREL_SYMBOLS = {
  SpToast: { from: '@/components/sp-toast/toast.uts', names: ['showToast', 'hideToast', 'showSuccess', 'showError', 'toastState'] },
  File: { from: '@/components/file/shared/index.uts', names: ['buildFileUrl', 'buildPreviewUrl', 'FileKind', 'getFileKind', 'PreviewableItem'] },
  FileUpload: { from: '@/components/file-upload/use-file-upload.uts', names: ['useFileUpload'] },
  SpSliderCaptcha: { from: '@/components/sp-slider-captcha/types/index.uts', names: ['CaptchaDataResponse', 'TrailPoint', 'VerifyResult'] },
  SpFilterSelect: { from: '@/components/sp-filter-select/props.uts', names: ['FilterOption'] },
}

// ---------------------------------------------------------------- 脚本转换

const LIFECYCLE = [
  ['useDidShow', 'onPageShow'],
  ['useDidHide', 'onPageHide'],
  ['useLoad', 'onLoad'],
  ['useUnload', 'onUnload'],
  ['useReady', 'onReady'],
  ['useReachBottom', 'onReachBottom'],
  ['usePullDownRefresh', 'onPullDownRefresh'],
  ['useShareAppMessage', 'onShareAppMessage'],
]

const UNI_API = new Set([
  'navigateTo', 'navigateBack', 'redirectTo', 'reLaunch', 'switchTab',
  'showToast', 'showModal', 'showLoading', 'hideLoading', 'showActionSheet',
  'previewImage', 'chooseImage', 'chooseMedia', 'chooseMessageFile',
  'uploadFile', 'downloadFile', 'openDocument', 'saveFile',
  'login', 'getUserProfile', 'requestSubscribeMessage',
  'getStorageSync', 'setStorageSync', 'removeStorageSync', 'getStorageInfoSync',
  'setNavigationBarTitle', 'setNavigationBarColor',
  'showTabBar', 'hideTabBar', 'stopPullDownRefresh', 'startPullDownRefresh',
  'getSystemInfoSync', 'getWindowInfo', 'getNetworkType',
  'createCameraContext', 'createSelectorQuery', 'createCanvasContext',
  'setClipboardData', 'getClipboardData', 'vibrateShort',
  'makePhoneCall', 'scanCode', 'saveImageToPhotosAlbum',
])

const SPECIAL_API = {
  'Taro.getEnv()': { code: 'getEnvName()', names: ['getEnvName'], from: '@/utils/platform' },
  'Taro.ENV_TYPE.WEAPP': { code: 'ENV_TYPE.WEAPP', names: ['ENV_TYPE'], from: '@/utils/platform' },
  'Taro.ENV_TYPE.WEB': { code: 'ENV_TYPE.WEB', names: ['ENV_TYPE'], from: '@/utils/platform' },
  'Taro.getCurrentInstance()': { code: 'getCurrentPageInfo()', names: ['getCurrentPageInfo'], from: '@/utils/router' },
  'Taro.getUpdateManager()': { code: 'getUpdateManager()', names: ['getUpdateManager'], from: '@/utils/update' },
  'Taro.CameraContext': { code: 'UniCameraContext', names: ['UniCameraContext'], from: '@/utils/platform' },
}

function transformScript(code, ctx) {
  const imports = new Map()

  code = code.replace(/^import\s+[^\n]*from\s+['"]@tarojs\/[^'"]*['"]\s*;?\s*$/gm, '')
  code = code.replace(/^import\s+[^\n]*from\s+['"]@nutui\/[^'"]*['"]\s*;?\s*$/gm, '')
  code = code.replace(/^import\s+styles\s+from\s+['"][^'"]*\.module\.scss['"]\s*;?\s*$/gm, '')
  // NutUI 图标在模板外的引用
  code = code.replace(/^import\s+\{[^}]*\}\s+from\s+['"]@nutui\/icons-vue-taro['"]\s*;?\s*$/gm, '')

  for (const [from, to] of LIFECYCLE)
    code = code.replace(new RegExp(`\\b${from}\\b`, 'g'), to)

  code = code.replace(/\bTaro\.(useDidShow|useDidHide|useLoad|useReachBottom|usePullDownRefresh)\b/g,
    (_, name) => LIFECYCLE.find(([f]) => f === name)[1])

  for (const [from, spec] of Object.entries(SPECIAL_API)) {
    if (!code.includes(from))
      continue
    code = code.split(from).join(spec.code)
    if (!imports.has(spec.from))
      imports.set(spec.from, new Set())
    for (const n of spec.names) imports.get(spec.from).add(n)
  }

  code = code.replace(/\bTaro\.([A-Za-z_$][\w$]*)/g, (m, name) => {
    if (UNI_API.has(name))
      return `uni.${name}`
    ctx.todo.push({ file: ctx.dest, reason: `未映射的 Taro API: ${m}` })
    return `uni.${name}`
  })

  code = code.replace(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+['"]@\/components\/([A-Za-z]+)['"]/g,
    (m, isType, namesRaw, comp) => {
      const names = namesRaw.split(',').map(s => s.trim()).filter(Boolean)
      if (isType) {
        const barrel = BARREL_SYMBOLS[comp]
        const from = barrel ? barrel.from : `@/components/${COMPONENTS[comp]}/${COMPONENTS[comp]}.uvue`
        return `import type { ${names.join(', ')} } from '${from}'`
      }
      const out = []
      const rest = []
      const barrel = BARREL_SYMBOLS[comp]
      for (const n of names) {
        if (barrel && barrel.names.includes(n))
          rest.push(n)
        else if (COMPONENTS[comp])
          out.push(`import ${n} from '@/components/${COMPONENTS[comp]}/${COMPONENTS[comp]}.uvue'`)
        else
          out.push(m)
      }
      if (rest.length)
        out.push(`import { ${rest.join(', ')} } from '${barrel.from}'`)
      return out.join('\n')
    })

  code = code.replace(/from\s+['"]@\/hooks\//g, 'from \'@/composables/')
  code = code.replace(/from\s+['"]@\/stores\//g, 'from \'@/store/')
  code = code.replace(/from\s+['"]@\/service\//g, 'from \'@/api/')
  // 相对路径的 .vue / .ts 引用改后缀
  code = code.replace(/(from\s+['"]\.[^'"]*)\.vue(['"])/g, '$1.uvue$2')

  if (imports.size) {
    const extra = [...imports].map(([from, names]) => `import { ${[...names].join(', ')} } from '${from}'`).join('\n')
    code = `${extra}\n${code}`
  }

  const seen = new Set()
  code = code.split('\n').filter((line) => {
    const t = line.trim()
    if (!/^import\s/.test(t))
      return true
    if (seen.has(t))
      return false
    seen.add(t)
    return true
  }).join('\n')

  return code.replace(/^\n+/, '')
}

// ---------------------------------------------------------------- class 绑定

/** 把 styles.xxx / styles['x'] / styles[expr] 统一换成类名字符串 */
function stripStylesRefs(tpl) {
  // styles[ ... ] —— 平衡方括号，取内部表达式
  let out = ''
  let i = 0
  while (i < tpl.length) {
    const idx = tpl.indexOf('styles[', i)
    if (idx < 0) {
      out += tpl.slice(i)
      break
    }
    out += tpl.slice(i, idx)
    let depth = 0
    let j = idx + 6 // 指向 '['
    for (; j < tpl.length; j++) {
      if (tpl[j] === '[') depth++
      else if (tpl[j] === ']') { depth--; if (depth === 0) break }
    }
    const inner = tpl.slice(idx + 7, j).trim()
    if (/^'[^']*'$/.test(inner) || /^"[^"]*"$/.test(inner))
      out += inner
    else
      out += `(${inner})`
    i = j + 1
  }
  // styles.xxx
  out = out.replace(/styles\.([A-Za-z_$][\w$]*)/g, (_m, k) => `'${k}'`)
  return out
}

/** 合并同一标签上的多个静态 class 属性 */
function mergeClassAttrs(tpl) {
  return tpl.replace(/<[a-zA-Z][\w-]*\b[^<>]*>/g, (tag) => {
    const matches = [...tag.matchAll(/\sclass="([^"]*)"/g)]
    if (matches.length < 2)
      return tag
    const merged = matches.map(m => m[1]).join(' ').trim().replace(/\s+/g, ' ')
    let first = true
    return tag.replace(/\sclass="[^"]*"/g, () => {
      if (first) {
        first = false
        return ` class="${merged}"`
      }
      return ''
    })
  })
}

function transformTemplate(tpl, ctx) {
  // 1. 事件：Taro 的 @tap → uni-app x 的 @click
  tpl = tpl.replace(/@tap\b/g, '@click')

  // 2. CSS Modules 引用 → 类名字面量
  if (/styles\s*[.[]/.test(tpl)) {
    tpl = stripStylesRefs(tpl)
    // 纯静态绑定降级成静态 class
    tpl = tpl.replace(/:class="([^"]*)"/g, (m, expr) => {
      const arrMatch = expr.match(/^\[\s*((?:'[^']*'\s*,\s*)*'[^']*')\s*\]$/)
      if (arrMatch) {
        const classes = arrMatch[1].split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean)
        return `class="${classes.join(' ')}"`
      }
      const single = expr.match(/^'([^']*)'$/)
      if (single)
        return `class="${single[1]}"`
      return m
    })
  }

  // 3. Taro 内置组件 → uni 内置组件
  tpl = tpl.replace(/<Video\b/g, '<video').replace(/<\/Video>/g, '</video>')

  // 4. 合并同一标签上的重复 class
  tpl = mergeClassAttrs(tpl)

  if (/<nut-/.test(tpl))
    ctx.nut.push(ctx.dest)

  return tpl
}

// ---------------------------------------------------------------- SCSS 扁平化

const TAG_SELECTOR_RE = /^(page|view|text|image|scroll-view|swiper|swiper-item|button|form|input|textarea|label|picker|picker-view|navigator|a|div|span|ul|li|p|h[1-6]|\*)\b/

/** 递归解析 scss 结构 */
function parseNodes(lines, start = 0) {
  const nodes = []
  let i = start
  while (i < lines.length) {
    const raw = lines[i]
    const t = raw.trim()

    if (t === '}') {
      return { nodes, next: i + 1 }
    }
    if (!t) { nodes.push({ type: 'blank' }); i++; continue }
    if (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) {
      nodes.push({ type: 'comment', text: raw })
      i++
      continue
    }

    if (t.endsWith('{')) {
      const sel = t.slice(0, -1).trim()
      const inner = parseNodes(lines, i + 1)
      nodes.push({
        type: sel.startsWith('@') ? 'at' : 'rule',
        sel,
        children: inner.nodes,
      })
      i = inner.next
      continue
    }

    // 声明（可能跨行）
    const decl = [raw]
    while (!raw.trimEnd().endsWith(';') && i + 1 < lines.length) {
      const nextT = lines[i + 1].trim()
      if (nextT === '}' || nextT.endsWith('{') || !nextT)
        break
      i++
      decl.push(lines[i])
      if (lines[i].trim().endsWith(';'))
        break
    }
    nodes.push({ type: 'decl', lines: decl })
    i++
  }
  return { nodes, next: i }
}

function isWebOnlySelector(sel) {
  // 逗号分隔的每个选择器单独判定；任一不被支持则整条规则进 WEB 条件编译
  return sel.split(',').some((part) => {
    const noParen = part.replace(/\([^)]*\)/g, '').trim()
    if (!noParen)
      return false
    if (/[+~]/.test(noParen))
      return true
    if (/\s/.test(noParen))
      return true
    if (/::/.test(noParen))
      return true
    if (/:(?!:)/.test(noParen))
      return true
    if (/\[/.test(noParen))
      return true
    return false
  })
}

function flattenScss(src, fileLabel) {
  const { nodes } = parseNodes(src.split('\n'))
  const out = []

  const emitDecls = (list, level) => {
    for (const node of list) {
      const pad = '  '.repeat(level)
      if (node.type === 'blank') { out.push(''); continue }
      if (node.type === 'comment') { out.push(pad + node.text.trim()); continue }
      if (node.type === 'decl') {
        for (const l of node.lines) out.push(pad + l.trim())
      }
    }
  }

  /** at 规则：内部保持嵌套结构 */
  const emitAt = (node, level) => {
    const pad = '  '.repeat(level)
    out.push(`${pad}${node.sel} {`)
    const isKeyframes = /^@(-webkit-)?keyframes/.test(node.sel)
    for (const child of node.children) {
      if (child.type === 'rule' || child.type === 'at') {
        if (isKeyframes) {
          out.push(`${'  '.repeat(level + 1)}${child.sel} {`)
          emitDecls(child.children, level + 2)
          out.push(`${'  '.repeat(level + 1)}}`)
        }
        else {
          emitAt(child, level + 1)
        }
      }
      else {
        emitDecls([child], level + 1)
      }
    }
    out.push(`${pad}}`)
  }

  /** 普通规则：自身声明成块（扁平），子规则提升到顶层 */
  const emitRule = (node, parentFull, level = 0) => {
    const pad = '  '.repeat(level)
    let full = node.sel
    let webOnly = false

    if (parentFull) {
      if (node.sel.includes('&')) {
        full = node.sel.replace(/&/g, parentFull)
        webOnly = isWebOnlySelector(full)
      }
      else {
        full = `${parentFull} ${node.sel}`
        webOnly = true
      }
    }
    else {
      webOnly = isWebOnlySelector(full)
    }

    if (TAG_SELECTOR_RE.test(full)) {
      stats.dropped.push(`${fileLabel}: ${full}`)
      out.push(`${pad}/* dropped: 标签选择器 ${full} 不受 ucss 支持 */`)
      return
    }

    const decls = node.children.filter(c => c.type === 'decl' || c.type === 'comment' || c.type === 'blank')
    const subs = node.children.filter(c => c.type === 'rule' || c.type === 'at')

    if (decls.length) {
      if (webOnly) {
        out.push(`${pad}/* #ifdef WEB */`)
        stats.webOnly++
      }
      out.push(`${pad}${full} {`)
      emitDecls(decls, level + 1)
      out.push(`${pad}}`)
      if (webOnly)
        out.push(`${pad}/* #endif */`)
      if (subs.length)
        out.push('')
    }

    for (const sub of subs) {
      if (sub.type === 'at')
        emitAt(sub, level)
      else
        emitRule(sub, full, level)
    }
  }

  for (const node of nodes) {
    if (node.type === 'at')
      emitAt(node, 0)
    else if (node.type === 'rule')
      emitRule(node, '', 0)
    else
      emitDecls([node], 0)
  }

  return polish(out)
}

/** 输出格式清理：去掉块内尾随空行，顶层规则之间补一个空行 */
function polish(lines) {
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === '' && (lines[i + 1] === undefined || lines[i + 1].trim() === '}'))
      continue
    out.push(line)
    if (line === '}' && i + 1 < lines.length && lines[i + 1] !== '' && lines[i + 1].trim() !== '}')
      out.push('')
  }
  return out.join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n[ \t]*\n([ \t]*\})/g, '\n$1')
    .replace(/\n{3,}/g, '\n\n')
}

// ---------------------------------------------------------------- 主流程

for (const dir of ['pages', 'components'])
  fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true })

const configs = {}

for (const file of walk(path.join(SRC, 'pages'))) {
  const rel = path.relative(path.join(SRC, 'pages'), file)

  if (file.endsWith('.config.ts')) {
    configs[rel.replace(/\.config\.ts$/, '')] = fs.readFileSync(file, 'utf8')
    continue
  }

  if (file.endsWith('.vue')) {
    const dest = path.join(ROOT, 'pages', rel.replace(/\.vue$/, '.uvue'))
    const ctx = { dest: path.relative(ROOT, dest), nut: stats.nut, todo: stats.todo }
    let content = fs.readFileSync(file, 'utf8')
    content = content.replace(/<script\s+setup\s+lang="ts">/g, '<script setup lang="uts">')
    content = content.replace(/<style([^>]*)\sscoped([^>]*)>/g, '<style$1$2>')
    content = content.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/g, (_m, o, body, c) => `${o}\n${transformScript(body, ctx)}\n${c}`)
    content = content.replace(/(<template>)([\s\S]*)(<\/template>)/g, (_m, o, body, c) => `${o}${transformTemplate(body, ctx)}${c}`)
    content = content.replace(/(['"][^'"]*)\.module\.scss/g, '$1.scss')
    write(dest, content)
    stats.vue++
    continue
  }

  if (file.endsWith('.module.scss')) {
    const dest = path.join(ROOT, 'pages', rel.replace(/\.module\.scss$/, '.scss'))
    write(dest, flattenScss(fs.readFileSync(file, 'utf8'), rel))
    stats.scss++
    continue
  }

  const dest = path.join(ROOT, 'pages', rel)
  ensureDir(dest)
  fs.copyFileSync(file, dest)
}

for (const [name, dir] of Object.entries(COMPONENTS)) {
  const srcDir = path.join(SRC, 'components', name)
  if (!fs.existsSync(srcDir))
    continue
  for (const file of walk(srcDir)) {
    const rel = path.relative(srcDir, file)
    if (rel === 'index.ts' || rel.endsWith('.d.ts'))
      continue

    const base = path.basename(rel)
    const sub = path.dirname(rel)
    const flatSub = sub === '.' ? '' : sub.replace(/^src\/?/, '')
    const mainStem = MAIN_FILE[name] || name
    const isMainVue = rel === `src/${mainStem}.vue` || rel === `src/${mainStem}.module.scss`

    let dest
    if (base.endsWith('.vue')) {
      dest = isMainVue
        ? path.join(ROOT, 'components', dir, `${dir}.uvue`)
        : path.join(ROOT, 'components', dir, flatSub, `${kebab(base.slice(0, -4))}.uvue`)
    }
    else if (base.endsWith('.module.scss')) {
      dest = isMainVue
        ? path.join(ROOT, 'components', dir, `${dir}.scss`)
        : path.join(ROOT, 'components', dir, flatSub, `${kebab(base.slice(0, -12))}.scss`)
    }
    else if (base.endsWith('.scss')) {
      dest = path.join(ROOT, 'components', dir, flatSub, base)
    }
    else if (base.endsWith('.ts')) {
      dest = path.join(ROOT, 'components', dir, flatSub, `${kebab(base.slice(0, -3))}.uts`)
    }
    else {
      dest = path.join(ROOT, 'components', dir, flatSub, base)
    }

    if (base.endsWith('.vue')) {
      const ctx = { dest: path.relative(ROOT, dest), nut: stats.nut, todo: stats.todo }
      let content = fs.readFileSync(file, 'utf8')
      content = content.replace(/<script\s+setup\s+lang="ts">/g, '<script setup lang="uts">')
      content = content.replace(/<style([^>]*)\sscoped([^>]*)>/g, '<style$1$2>')
      content = content.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/g, (_m, o, body, c) => `${o}\n${transformScript(body, ctx)}\n${c}`)
      content = content.replace(/(<template>)([\s\S]*)(<\/template>)/g, (_m, o, body, c) => `${o}${transformTemplate(body, ctx)}${c}`)
      content = content.replace(/(['"][^'"]*)\.module\.scss/g, '$1.scss')
      write(dest, content)
      stats.vue++
    }
    else if (base.endsWith('.module.scss')) {
      write(dest, flattenScss(fs.readFileSync(file, 'utf8'), rel))
      stats.scss++
    }
    else if (base.endsWith('.ts')) {
      const ctx = { dest: path.relative(ROOT, dest), nut: stats.nut, todo: stats.todo }
      let content = transformScript(fs.readFileSync(file, 'utf8'), ctx)
      content = content.replace(/(['"][^'"]*)\.module\.scss/g, '$1.scss')
      write(dest, content)
      stats.uts++
    }
    else {
      write(dest, fs.readFileSync(file))
    }
  }
}

write(path.join(ROOT, 'scripts/.page-configs.json'), JSON.stringify(configs, null, 2))

console.log(JSON.stringify({
  vue: stats.vue,
  scss: stats.scss,
  uts: stats.uts,
  pageConfigs: Object.keys(configs),
  webOnlyBlocks: stats.webOnly,
  droppedTagSelectors: stats.dropped,
  nutFiles: [...new Set(stats.nut)],
  todo: stats.todo,
}, null, 2))

// ---------------------------------------------------------------- 样式内联

/**
 * uni-app x 的 .uvue 单文件组件对 `<style src>` 支持不稳定，
 * 这里把同名的 .scss 内联进 `<style lang="scss">`，并删除独立样式文件。
 */
function inlineStyles() {
  let inlined = 0
  for (const file of walk(ROOT)) {
    if (!file.endsWith('.uvue'))
      continue
    const scssFile = file.replace(/\.uvue$/, '.scss')
    if (!fs.existsSync(scssFile))
      continue
    const css = fs.readFileSync(scssFile, 'utf8').trim()
    let content = fs.readFileSync(file, 'utf8')

    // 已存在 <style> 块（SpEmpty 的内联样式）→ 合并
    if (/<style[^>]*>[\s\S]*?<\/style>/.test(content)) {
      content = content.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/, (_m, open, body, close) => {
        const tag = /lang="scss"/.test(open) ? open : open.replace('<style', '<style lang="scss"')
        return `${tag}\n${body.trim()}\n\n${css}\n${close}`
      })
    }
    else {
      content = `${content.trimEnd()}\n\n<style lang="scss">\n${css}\n</style>\n`
    }

    fs.writeFileSync(file, content)
    fs.unlinkSync(scssFile)
    inlined++
  }
  // 删掉残留的空目录里的 scss
  return inlined
}

const inlined = inlineStyles()
console.log(`inlined styles: ${inlined}`)
