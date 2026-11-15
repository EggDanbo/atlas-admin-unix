/**
 * 迁移后期处理（语义改造部分）
 *
 * migrate-from-taro.mjs 只做机械转换，本脚本负责「脚本判定不了、但可以规则化」的部分：
 *   1. process.env.TARO_ENV → 平台判断
 *   2. 命名空间类型扁平化（Service.Result → ServiceResult）+ 补 type import
 *   3. defineProps 类型式声明 → 运行时声明；defineEmits<T>() → defineEmits([...])
 *   4. NutUI 组件 → 原生组件（input / button / avatar / popup / switch / progress / skeleton / grid / icons）
 *   5. Taro 遗留写法（空标签不自闭合、class 对象计算键、ReturnType<typeof X>、computed<T>()）
 *
 * 幂等：可重复执行。migrate-from-taro.mjs 之后紧接执行本脚本即可还原全部改造。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function walk(dir, out = [], skip = ['node_modules', 'unpackage', '.git', 'docs', 'scripts']) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.includes(e.name))
      continue
    const full = path.join(dir, e.name)
    if (e.isDirectory())
      walk(full, out, skip)
    else out.push(full)
  }
  return out
}

const files = walk(ROOT).filter(f => f.endsWith('.uvue') || f.endsWith('.uts'))
const report = {}

function bump(k) {
  report[k] = (report[k] || 0) + 1
}

function read(f) {
  return fs.readFileSync(f, 'utf8')
}

function write(f, s) {
  fs.writeFileSync(f, s)
}

const misses = []

function patch(f, pairs, label) {
  let s = read(f)
  let hit = false
  for (const [a, b] of pairs) {
    if (s.includes(a)) {
      s = s.replace(a, b)
      hit = true
    }
    else {
      misses.push(`${path.relative(ROOT, f)} ← ${a.slice(0, 48).replace(/\n/g, '⏎')}`)
    }
  }
  if (hit) {
    write(f, s)
    bump(label)
  }
}

// ---------------------------------------------------------------- 1. process.env

for (const f of files) {
  let s = read(f)
  const before = s
  s = s.replace(/process\.env\.TARO_ENV === 'h5'/g, 'isWeb()')
  s = s.replace(/process\.env\.TARO_ENV === 'weapp'/g, 'isWeapp()')
  if (s !== before) {
    if (!s.includes("from '@/utils/platform.uts'")) {
      const m = s.match(/^import .*$/m)
      s = m
        ? s.replace(m[0], `${m[0]}\nimport { isWeb, isWeapp } from '@/utils/platform.uts'`)
        : `import { isWeb, isWeapp } from '@/utils/platform.uts'\n${s}`
    }
    write(f, s)
    bump('processEnv')
  }
}

// ---------------------------------------------------------------- 2. 类型扁平化

const NS = ['Service', 'Auth', 'FileStorage', 'GuestAuth', 'WechatAuth', 'WechatWorkAuth']

for (const f of files) {
  if (f.includes(`${path.sep}types${path.sep}`))
    continue
  let s = read(f)
  const used = new Set()
  s = s.replace(new RegExp(`\\b(${NS.join('|')})\\.([A-Z][A-Za-z0-9_]*)`, 'g'), (_m, ns, name) => {
    used.add(ns + name)
    return ns + name
  })
  if (used.size === 0)
    continue

  const existing = s.match(/import type \{([^}]*)\} from '@\/types\/api\.uts'/)
  if (existing) {
    const names = new Set(existing[1].split(',').map(x => x.trim()).filter(Boolean))
    for (const n of used) names.add(n)
    s = s.replace(existing[0], `import type { ${[...names].sort().join(', ')} } from '@/types/api.uts'`)
  }
  else {
    const imp = `import type { ${[...used].sort().join(', ')} } from '@/types/api.uts'\n`
    const m = s.match(/^import .*$/m)
    s = m ? s.replace(m[0], imp + m[0]) : imp + s
  }
  write(f, s)
  bump('types')
}

// ---------------------------------------------------------------- 3. props / emits

function braceEnd(s, open) {
  let depth = 0
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{')
      depth++
    else if (s[i] === '}') {
      depth--
      if (depth === 0)
        return i
    }
  }
  return -1
}

function ctor(t) {
  t = t.trim()
  if (t.startsWith('\'') || t.startsWith('"'))
    return 'String'
  if (t === 'string')
    return 'String'
  if (t === 'number')
    return 'Number'
  if (t === 'boolean')
    return 'Boolean'
  if (t.endsWith('[]') || t.startsWith('Array'))
    return 'Array'
  if (t.startsWith('Record<') || t.startsWith('Map<'))
    return 'Object'
  if (t.includes('|') && (t.includes('\'') || t.includes('"')))
    return 'String'
  return 'Object'
}

for (const f of files.filter(x => x.endsWith('.uvue'))) {
  let s = read(f)
  const before = s

  for (let guard = 0; guard < 4; guard++) {
    const m = s.match(/(withDefaults\()?defineProps</)
    if (!m)
      break
    const hasDefaults = m[1] != null
    const genStart = s.indexOf('<', m.index)
    const genEnd = braceEnd(s, genStart)
    const body = s.slice(genStart + 1, genEnd)
    const closeGen = s.indexOf('>', genEnd)

    let defaultsRaw = ''
    let replaceEnd
    if (hasDefaults) {
      const rest = s.slice(closeGen + 1)
      const mm = rest.match(/\(\)\s*,\s*\{/)
      if (!mm)
        break
      const dStart = closeGen + 1 + mm.index + mm[0].length - 1
      const dEnd = braceEnd(s, dStart)
      defaultsRaw = s.slice(dStart + 1, dEnd)
      replaceEnd = dEnd + 1
      if (s.slice(replaceEnd, replaceEnd + 1) === ')')
        replaceEnd += 1
    }
    else {
      replaceEnd = closeGen + 1
      if (s.slice(replaceEnd, replaceEnd + 2) === '()')
        replaceEnd += 2
    }

    const defaults = {}
    for (const line of defaultsRaw.split('\n')) {
      const dm = line.match(/\s*(\w+)\s*:\s*(.+?),\s*$/)
      if (dm)
        defaults[dm[1]] = dm[2]
    }

    const fields = []
    for (const line of body.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('/*') || t.startsWith('*') || t.startsWith('//'))
        continue
      const fm = t.match(/(\w+)\??:\s*(.+?),?$/)
      if (!fm)
        continue
      const name = fm[1]
      let entry = `  ${name}: { type: ${ctor(fm[2])}`
      if (name in defaults)
        entry += `, default: ${defaults[name]}`
      entry += ' }'
      fields.push(entry)
    }
    s = `${s.slice(0, m.index)}defineProps({\n${fields.join(',\n')},\n})${s.slice(replaceEnd)}`
  }

  for (let guard = 0; guard < 4; guard++) {
    const m = s.match(/defineEmits</)
    if (!m)
      break
    const genStart = s.indexOf('<', m.index)
    const genEnd = braceEnd(s, genStart)
    const body = s.slice(genStart + 1, genEnd)
    const names = new Set(body.match(/'([\w:-]+)'/g)?.map(x => x.replace(/'/g, '')) ?? [])
    for (const nm of body.match(/^\s*(\w+)\s*:\s*\[/gm) ?? [])
      names.add(nm.trim().replace(/\s*:\s*\[$/, ''))
    const closeGen = s.indexOf('>', genEnd)
    let replaceEnd = closeGen + 1
    if (s.slice(replaceEnd, replaceEnd + 2) === '()')
      replaceEnd += 2
    const arr = [...names].sort().map(n => `'${n}'`).join(', ')
    s = `${s.slice(0, m.index)}defineEmits([${arr}])${s.slice(replaceEnd)}`
  }

  if (s !== before) {
    write(f, s)
    bump('propsEmits')
  }
}

// ---------------------------------------------------------------- 4. NutUI 组件

const DARK_HINT = ['white', 'retry', 'switch', 'cancel', 'ghost', 'plain']

for (const f of files.filter(x => x.endsWith('.uvue'))) {
  let s = read(f)
  const before = s

  // <img> → <image>
  s = s.replace(/<img\b/g, '<image').replace(/<\/img>/g, '</image>')

  // nut-input → input
  s = s.replace(/<nut-input\b([\s\S]*?)\/>/g, (_m, attrs) => {
    const parts = attrs.match(/\S+?="[^"]*"|@[\w]+="[^"]*"|\S+/g) ?? []
    const out = []
    for (const a of parts) {
      const key = a.split('=')[0]
      if (['clearable', 'show-password', ':show-password', 'size'].includes(key))
        continue
      if (key === 'type' && a.includes('password')) {
        out.push('password="true"')
        continue
      }
      out.push(a)
    }
    return `<input class="sp-input" ${out.join(' ')} />`
  })

  // nut-button → view + text
  s = s.replace(/<nut-button\b([^>]*)>([\s\S]*?)<\/nut-button>/g, (_m, attrs, content) => {
    const cls = attrs.match(/class="([^"]*)"/)
    const classes = cls ? cls[1].split(/\s+/) : []
    if (/\bblock\b/.test(attrs))
      classes.push('sp-btn--block')
    if (/type="primary"/.test(attrs))
      classes.push('sp-btn--primary')
    const dark = classes.some(c => DARK_HINT.some(h => c.includes(h)))
    const textCls = dark ? 'sp-btn-text sp-btn-text--dark' : 'sp-btn-text'
    const extra = []
    const dis = attrs.match(/:disabled="([^"]*)"/)
    if (dis)
      extra.push(`:class="${dis[1]} ? 'sp-btn--disabled' : ''"`)
    const style = attrs.match(/style="([^"]*)"/)
    if (style)
      extra.push(`style="${style[1]}"`)
    for (const ev of attrs.match(/@[\w-]+="[^"]*"/g) ?? [])
      extra.push(ev)
    const allCls = ['sp-btn', ...classes].join(' ').trim()
    const body = content.split('\n').map(x => x.trim()).filter(Boolean).join(' ')
    return `<view class="${allCls}" ${extra.join(' ')}>\n        <text class="${textCls}">\n          ${body}\n        </text>\n      </view>`
  })

  // nut-switch → switch
  s = s.replace(/<nut-switch v-model="([^"]*)"\s*\/>/g, '<switch :checked="$1" @change="onWorkingChange" />')

  // nut-progress → 自绘进度条
  s = s.replace(/<nut-progress[\s\S]*?\/>/g, `<view class="progressTrack">
              <view class="progressBar" :style="{ width: task.progress + '%' }" />
            </view>`)

  // nut-popup → mask + sheet
  s = s.replace(/<nut-popup\s+v-model:visible="(\w+)"[\s\S]*?>/g,
    '<view v-if="$1" class="sp-mask" @click="$1 = false">\n        <view class="sp-sheet" @click.stop>')
  s = s.replace(/<\/nut-popup>/g, '        </view>\n      </view>')

  // nut-grid → flex
  s = s.replace(/<nut-grid[\s\S]*?<\/nut-grid>/g, `<view class="demo-menu-grid">
        <view
          v-for="item in demoMenus"
          :key="item.label"
          class="demo-menu-item"
          @click="handleMenuTap()"
        >
          <text class="demo-menu-glyph">
            {{ item.glyph }}
          </text>
          <text class="demo-menu-label">
            {{ item.label }}
          </text>
        </view>
      </view>`)

  if (s !== before) {
    write(f, s)
    bump('nutui')
  }
}

// ---------------------------------------------------------------- 5. 其它 Taro 遗留写法

const VOID_TAGS = 'image|input|switch|slider|progress|canvas|map|camera|video|audio|icon'

for (const f of files.filter(x => x.endsWith('.uvue'))) {
  let s = read(f)
  const before = s

  // 空标签自闭合
  s = s.replace(new RegExp(`<(${VOID_TAGS})\\b(?:"[^"]*"|'[^']*'|[^>"'])*>`, 'g'), (tag) => {
    if (/\/>$/.test(tag.trim()))
      return tag
    return `${tag.slice(0, -1).replace(/\s+$/, '')} />`
  })

  // class 对象里的计算键 → 三元
  s = s.replace(/\{\s*\['([\w-]+)'\]\s*:\s*([^{}]+?)\s*\}/g, '($2 ? \'$1\' : \'\')')

  // 去掉多余的括号包裹的模板字符串
  s = s.replace(/\(\s*(`[^`]*`)\s*\)/g, '$1')

  // ReturnType / 泛型 computed
  s = s.replace(/ReturnType<typeof setInterval>/g, 'number')
  s = s.replace(/ReturnType<typeof setTimeout>/g, 'number')
  s = s.replace(/ReturnType<typeof [A-Za-z_]\w*>/g, 'any')
  s = s.replace(/computed<[^>]*>\(/g, 'computed(')

  if (s !== before) {
    write(f, s)
    bump('syntax')
  }
}

// ---------------------------------------------------------------- 6. 定点修正

const FIXES = [
  // 登录引导页：图标 → 字形、对象索引 → 循环
  ['components/auth-layout/login-prompt.uvue', [
    [`const demoMenus = [
  { icon: Share, label: '我的申请', color: colors.blue },
  { icon: Success, label: '我的审批', color: colors.blue },
  { icon: Notice, label: '我的消息', color: colors.blue },
]`, `const demoMenus = [
  { glyph: '📄', label: '我的申请', color: colors.blue },
  { glyph: '✅', label: '我的审批', color: colors.blue },
  { glyph: '🔔', label: '我的消息', color: colors.blue },
]`],
    [`            <People size="24" color="#ffffff" />`, `            <text class="demo-avatar-glyph">
              👤
            </text>`],
    [`              <Right size="14" color="rgba(255,255,255,0.8)" />`, `              <text class="demo-card-arrow">
                ›
              </text>`],
    [`  const businessParams = Object.fromEntries(
    Object.entries(params).filter(([key]) => !['code', 'state', 'path'].includes(key)),
  )`, `  const businessParams: Record<string, string> = {}
  const keys = Object.keys(params)
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]
    if (k === 'code' || k === 'state' || k === 'path')
      continue
    businessParams[k] = params[k]
  }`],
  ]],

  ['pages/index/components/MenuGrid.uvue', [
    [`interface MenuItem {
  icon: any`, `interface MenuItem {
  glyph: string`],
    [`          <component :is="item.icon" :size="19" :color="item.color" />`, `          <text class="tile-glyph" :style="{ color: item.color }">
            {{ item.glyph }}
          </text>`],
    [`.tile-label {`, `.tile-glyph {
  font-size: 38px;
  line-height: 42px;
}

.tile-label {`],
  ]],

  // SpCard：useSlots → getCurrentInstance
  ['components/sp-card/sp-card.uvue', [
    [`import { computed, useSlots } from 'vue'`, `import { computed, getCurrentInstance } from 'vue'`],
    [`const slots = useSlots()
const hasHead = computed(() => !!(props.title || props.hint || slots.title || slots.extra))`,
      `const instance = getCurrentInstance()
const slots = computed(() => instance?.slots ?? {})
const hasHead = computed(() => !!(props.title || props.hint || slots.value.title || slots.value.extra))`],
  ]],

  // 打卡页：对象索引 → Map
  ['pages/checkin/index.uvue', [
    [`const dialTitle = computed(() => ({ in: '上班打卡', out: '下班打卡', done: '今日已完成' }[phase.value]))`,
      `const TITLE_MAP = new Map<string, string>([
  ['in', '上班打卡'],
  ['out', '下班打卡'],
  ['done', '今日已完成'],
])

const HINT_MAP = new Map<string, string>([
  ['in', '点击记录上班时间'],
  ['out', '点击记录下班时间'],
  ['done', '下班记得按时打卡'],
])

const dialTitle = computed(() => TITLE_MAP.get(phase.value) ?? '上班打卡')`],
    [`  return { in: '点击记录上班时间', out: '点击记录下班时间', done: '下班记得按时打卡' }[phase.value]`,
      `  return HINT_MAP.get(phase.value) ?? '点击记录上班时间'`],
  ]],

  // 个人信息：状态类计算键 + 开关回调
  ['pages/mine/profile/index.uvue', [
    [`async function loadTeamTree() {`, `function onWorkingChange(e: any) {
  formData.working = e.detail.value === true
}

async function loadTeamTree() {`],
  ]],

  // OAuth 回调页：生命周期
  ['pages/oauthCallback/index.uvue', [
    [`uni.onLoad(() => {`, `onLoad(() => {`],
    [`  const path = params.path as string | undefined`, `  const path = params['path'] ?? ''`],
    [`  if (path) {`, `  if (path.length > 0) {`],
  ]],

  // 文件图标（file-upload）
  ['components/file-upload/file-upload.uvue', [
    [`function getFileIcon(item: FileStorageFileResourceModel): string {
  if (isVideo(item))
    return 'play-circle-fill'
  return 'order'
}`, `function getFileIcon(item: FileStorageFileResourceModel): string {
  // uni-app x 不支持图标字体伪元素，用 unicode 字形替代原 NutUI 图标
  if (isVideo(item))
    return '▶'
  return '📄'
}`],
    [`          <IconFont name="play-circle-fill" size="48" />`, `          <text class="fileIcon">
            ▶
          </text>`],
    [`          <IconFont :name="getFileIcon(item)" size="48" />`, `          <text class="fileIcon">
            {{ getFileIcon(item) }}
          </text>`],
    [`        <IconFont name="close" size="12" color="#fff" />`, `        <text class="closeGlyph">
          ✕
        </text>`],
    [`            <IconFont name="failure" size="32" color="var(--nut-primary-color)" />`, `            <text class="failGlyph">
              !
            </text>`],
    [`      <IconFont name="plus" size="24" class="addIcon" />`, `      <text class="addIcon">
        ＋
      </text>`],
    [`      <IconFont name="close" size="20" color="#fff" />`, `      <text class="closeGlyph">
        ✕
      </text>`],
  ]],

  // 人脸结果图标
  ['pages/mine/face/components/FaceStreamCapture.uvue', [
    [`          <IconFont
            v-else
            :name="phase === 'success' ? 'checked' : 'issue'"
            size="80"
            :color="phase === 'success' ? '#57842D' : '#F14B5E'"
          />`, `          <text
            v-else
            class="result-glyph"
            :style="{ color: phase === 'success' ? '#57842D' : '#F14B5E' }"
          >
            {{ phase === 'success' ? '✓' : '!' }}
          </text>`],
  ]],

  // 请求层：ServiceResult 改从 types/api.uts 引入
  ['api/http/index.uts', [
    [`import type { RequestOptions, ServiceResult } from '@/types/service.uts'`,
      `import type { RequestOptions } from '@/types/service.uts'
import type { ServiceResult } from '@/types/api.uts'`],
  ]],

  // 文件预览：浏览器 API 加条件编译
  ['composables/use-file-preview.uts', [
    [`      if (previewUrl) {
        // 微信/企微 webview 会拦截 window.open（静默失败），需用当前页导航
        if (isH5Wechat() || isH5Wecom())
          window.location.href = previewUrl
        else
          window.open(previewUrl)
        return
      }`, `      if (previewUrl.length > 0) {
        // #ifdef WEB
        // 微信/企微 webview 会拦截 window.open（静默失败），需用当前页导航
        if (isH5Wechat() || isH5Wecom())
          window.location.href = previewUrl
        else
          window.open(previewUrl)
        // #endif
        return
      }`],
  ]],

  // 用户卡片头像
  ['pages/index/components/UserCard.uvue', [
  ]],

  // 我的页面头像
  ['pages/mine/index.uvue', [
  ]],

  // 短信验证码输入框（带右侧按钮）
  ['pages/login/components/SmsLogin.uvue', [
    [`      <nut-input
        v-model="smsForm.code"
        placeholder="请输入验证码"
        type="number"
        maxlength="6"
      >
        <template #right>
          <view
            :class="['sms-send', (smsCountdown > 0 || smsSending) && 'sms-send--disabled']"
            @click="smsCountdown <= 0 && !smsSending && sendSmsCode()"
          >
            {{ smsCountdown > 0 ? \`\${smsCountdown}s\` : smsSending ? '发送中...' : '获取验证码' }}
          </view>
        </template>
      </nut-input>`, `      <view class="sms-code-row">
        <input class="sp-input" v-model="smsForm.code" placeholder="请输入验证码" type="number" maxlength="6" />
        <view
          :class="['sms-send', (smsCountdown > 0 || smsSending) ? 'sms-send--disabled' : '']"
          @click="sendSmsCode()"
        >
          <text class="sms-send-text">
            {{ smsCountdown > 0 ? \`\${smsCountdown}s\` : smsSending ? '发送中...' : '获取验证码' }}
          </text>
        </view>
      </view>`],
  ]],
]

for (const [rel, pairs] of FIXES) {
  const f = path.join(ROOT, rel)
  if (fs.existsSync(f))
    patch(f, pairs, 'fixpoint')
}

// 首页菜单：图标组件 → 字形（按 label 映射，逐行重写 icon 字段）
{
  const f = path.join(ROOT, 'pages/index/components/MenuGrid.uvue')
  if (fs.existsSync(f)) {
    const GLYPHS = {
      '考勤规则': '⚙',
      '我的申请': '📋',
      '请假申请': '📝',
      '组织通讯录': '👥',
      '成员管理': '🙋',
      '考勤统计': '📊',
      '数据看板': '📈',
      '消息中心': '🔔',
    }
    let src = read(f)
    let hit = 0
    for (const [label, glyph] of Object.entries(GLYPHS)) {
      const re = new RegExp(`\\{ icon: [A-Za-z_$][\\w$]*, label: '${label}'`)
      if (re.test(src)) {
        src = src.replace(re, `{ glyph: '${glyph}', label: '${label}'`)
        hit++
      }
    }
    if (hit > 0) {
      write(f, src)
      bump('menuGlyphs')
    }
    if (hit !== 8)
      misses.push(`MenuGrid 菜单图标仅替换 ${hit}/8 条`)
  }
}


// 箭头图标：<Right ... /> → 字形
for (const f of files.filter(x => x.endsWith('.uvue'))) {
  let s = read(f)
  const before = s
  s = s.replace(/<Right\b([^>]*?)\/>/g, (_m, attrs) => {
    const color = attrs.match(/color="([^"]*)"/)
    const directives = (attrs.match(/\sv-[a-z-]+(?:="[^"]*")?/g) ?? []).map(x => x.trim()).join(' ')
    const c = color ? color[1] : '#c2c6d4'
    return `<text${directives ? ` ${directives}` : ''} class="sp-icon-chevron" :style="{ color: '${c}' }">›</text>`
  })
  if (s !== before) {
    write(f, s)
    bump('icons')
  }
}

// 任意文件选择：DOM 实现只在 Web 端编译
{
  const f = path.join(ROOT, 'components/file-upload/use-file-select.uts')
  if (fs.existsSync(f)) {
    let s = read(f)
    const before = s
    const start = s.indexOf('/** H5 环境通过原生')
    const end = s.indexOf("/** 选择任意文件（mode='file'） */")
    if (start >= 0 && end > start) {
      const replacement = `/**
 * 任意文件选择
 *
 * Web：用原生 <input type="file">（可多选、可指定 accept）
 * 其它端：没有 DOM，退化为系统相册/媒体选择器
 */
function selectAnyFilesH5(remaining: number, _accepts: string[]): Promise<SelectedFile[]> {
  // #ifdef WEB
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    if (remaining > 1)
      input.multiple = true
    input.style.display = 'none'

    let resolved = false
    // 用户取消：文件对话框关闭后 focus 回页面
    const onCancel = () => setTimeout(() => {
      if (resolved)
        return
      resolved = true
      input.remove()
      window.removeEventListener('focus', onCancel)
      resolve([])
    }, 300)
    window.addEventListener('focus', onCancel)

    input.onchange = () => {
      resolved = true
      window.removeEventListener('focus', onCancel)
      const files = Array.from(input.files != null ? input.files : [])
      const results: SelectedFile[] = files.map((f: any) => ({
        path: URL.createObjectURL(f),
        name: f.name,
        size: f.size,
        type: f.type.length > 0 ? f.type : '',
      }))
      input.remove()
      resolve(results)
    }

    document.body.appendChild(input)
    input.click()
  })
  // #endif
  // #ifndef WEB
  return selectMedia(remaining, ['album', 'camera'])
  // #endif
}

`
      s = s.slice(0, start) + replacement + s.slice(end)
    }
    if (s !== before) {
      write(f, s)
      bump('filePicker')
    }
  }
}

// 其余 NutUI 图标组件（<Check /> <Loading /> <My /> ...）→ unicode 字形
{
  const GLYPH_MAP = {
    Check: '✓',
    Loading: '◌',
    My: '👤',
    Photograph: '📷',
    PlayCircleFill: '▶',
    Right: '›',
    People: '👥',
    Setting: '⚙',
    Order: '📋',
    Edit: '📝',
    Date: '📅',
    Marshalling: '📈',
    Notice: '🔔',
    Success: '✅',
    Share: '↗',
    Close: '✕',
    Plus: '＋',
  }
  for (const f of files.filter(x => x.endsWith('.uvue'))) {
    let src = read(f)
    const before = src
    for (const [name, glyph] of Object.entries(GLYPH_MAP)) {
      const re = new RegExp(`<${name}\\b([^>]*?)\\/>`, 'g')
      src = src.replace(re, (_m, attrs) => {
        const keep = []
        const vIf = attrs.match(/\s(v-if="[^"]*"|v-else-if="[^"]*"|v-else)/)
        if (vIf)
          keep.push(vIf[1])
        const cls = attrs.match(/\sclass="([^"]*)"/)
        const clsList = cls ? ['sp-glyph', cls[1]] : ['sp-glyph']
        keep.push(`class="${clsList.join(' ')}"`)
        const color = attrs.match(/\scolor="([^"]*)"/)
        const size = attrs.match(/\ssize="(\d+)"/)
        const styles = []
        if (color)
          styles.push(`color: '${color[1]}'`)
        if (size)
          styles.push(`fontSize: '${Number(size[1]) * 2}rpx'`)
        if (styles.length)
          keep.push(`:style="{ ${styles.join(', ')} }"`)
        return `<text ${keep.join(' ')}>${glyph}</text>`
      })
    }
    if (src !== before) {
      write(f, src)
      bump('glyphIcons')
    }
  }
}


// 头像：nut-avatar + image → 单个 image
for (const f of files.filter(x => x.endsWith('.uvue'))) {
  let s = read(f)
  const before = s
  s = s.replace(/<nut-avatar\s+v-if="([^"]+)"[^>]*>\s*<image :src="([^"]+)"[^>]*?\/?>\s*<\/nut-avatar>/g,
    (_m, cond, src) => `<image v-if="${cond}" class="hero-avatar" :src="${src}" mode="aspectFill" />`)
  if (s !== before) {
    write(f, s)
    bump('avatar')
  }
}

// 接口层：process.env.TARO_APP_API_AUTH_PREFIX → 配置对象
for (const f of files.filter(x => x.endsWith('.uts'))) {
  let s = read(f)
  const before = s
  s = s.replace(/const authPrefix = process\.env\.TARO_APP_API_AUTH_PREFIX \|\| 'mis'/g,
    "import { appConfig } from '@/constants/config.uts'\n\nconst authPrefix = appConfig.apiAuthPrefix")
  if (s !== before) {
    write(f, s)
    bump('apiPrefix')
  }
}

// 骨架屏（auth-layout）
{
  const f = path.join(ROOT, 'components/auth-layout/auth-layout.uvue')
  if (fs.existsSync(f)) {
    patch(f, [
      [`      <nut-skeleton width="250px" height="15px" animated avatar avatar-size="60px" row="3" />`,
        `      <view class="skeleton">
        <view class="skeleton-avatar" />
        <view class="skeleton-body">
          <view class="skeleton-line skeleton-line--long" />
          <view class="skeleton-line" />
          <view class="skeleton-line skeleton-line--short" />
        </view>
      </view>`],
      [`.loadingWrapper {`, `.skeleton {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
}

.skeleton-avatar {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  background-color: #eceef7;
}

.skeleton-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 8px;
}

.skeleton-line {
  height: 26px;
  border-radius: 8px;
  background-color: #eceef7;
}

.skeleton-line--long {
  width: 80%;
}

.skeleton-line--short {
  width: 50%;
}

.loadingWrapper {`],
    ], 'skeleton')
  }
}

// ---------------------------------------------------------------- 7. 整文件替换（自绘画法等）

const CUSTOM_FILES = [
  ['scripts/templates/page-navbar.uvue', 'components/page-navbar/page-navbar.uvue'],
  ['scripts/templates/preview-page.uvue', 'pages/mine/preview/index.uvue'],
]

for (const [tpl, dest] of CUSTOM_FILES) {
  const src = path.join(ROOT, tpl)
  if (!fs.existsSync(src))
    continue
  fs.writeFileSync(path.join(ROOT, dest), fs.readFileSync(src, 'utf8'))
  bump('customFiles')
}

console.log(JSON.stringify(report, null, 2))
if (misses.length) {
  console.warn(`\n⚠️  未命中的替换 ${misses.length} 处（源码变了？）：`)
  misses.slice(0, 20).forEach(m => console.warn('  ' + m))
}
