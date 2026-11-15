/**
 * 修正迁移后的 import 路径
 *
 * 1. `@/api/api/*` 双前缀（API 迁移脚本留下的）
 * 2. 驼峰文件名 / 缺扩展名 → 实际的 kebab-case + .uts / .uvue
 * 3. 少数指向已重构模块的引用
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const kebab = s => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase()

function walk(dir, out = [], skip = ['node_modules', '.src-legacy', '.git', 'docs', 'scripts']) {
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

const EXPLICIT = [
  ['@/api/api/', '@/api/'],
  ['@/constants/auth', '@/constants/config.uts'],
  ['@/components/sp-filter-select/props.uts', '@/components/sp-filter-select/types.uts'],
  ['@/components/SpToast', '@/components/sp-toast/toast.uts'],
  ['@/components/File/shared', '@/components/file/shared/index.uts'],
  ['@/components/SpSliderCaptcha/src/types', '@/components/sp-slider-captcha/types/index.uts'],
  ['@/components/FileUpload/src/useFileUpload', '@/components/file-upload/use-file-upload.uts'],
  ['@/composables/useFilePreview', '@/composables/use-file-preview.uts'],
  ['@/composables/useAuthLoad', '@/composables/use-auth-load.uts'],
]

function resolveTarget(fromFile, spec) {
  const base = spec.startsWith('@/')
    ? path.join(ROOT, spec.slice(2))
    : path.resolve(path.dirname(fromFile), spec)
  const candidates = [base, `${base}.uvue`, `${base}.uts`, `${base}.json`, path.join(base, 'index.uts')]
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile())
      return c
  }
  // 驼峰 → kebab
  const dir = path.dirname(base)
  const name = path.basename(base).replace(/\.(uvue|uts|vue|ts|scss)$/, '')
  for (const ext of ['.uvue', '.uts', '.scss']) {
    const c = path.join(dir, `${kebab(name)}${ext}`)
    if (fs.existsSync(c))
      return c
  }
  return null
}

let fixed = 0
let unresolved = []

for (const file of walk(ROOT)) {
  if (!/\.(uvue|uts)$/.test(file))
    continue
  let text = fs.readFileSync(file, 'utf8')
  const before = text

  for (const [from, to] of EXPLICIT)
    text = text.split(from).join(to)

  text = text.replace(/from\s+'([^']+)'/g, (m, spec) => {
    if (!spec.startsWith('@/') && !spec.startsWith('.'))
      return m
    const resolved = resolveTarget(file, spec)
    if (resolved != null) {
      // 已经是正确写法则不动
      const normalized = spec.startsWith('@/')
        ? `@/${path.relative(ROOT, resolved).split(path.sep).join('/')}`
        : `./${path.relative(path.dirname(file), resolved).split(path.sep).join('/')}`
      return `from '${normalized}'`
    }
    unresolved.push(`${path.relative(ROOT, file)} → ${spec}`)
    return m
  })

  if (text !== before) {
    fs.writeFileSync(file, text)
    fixed++
  }
}

console.log(`fixed files: ${fixed}`)
if (unresolved.length) {
  console.log('unresolved:')
  console.log([...new Set(unresolved)].join('\n'))
}
