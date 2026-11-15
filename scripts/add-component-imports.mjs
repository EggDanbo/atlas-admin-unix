/**
 * 补齐组件导入
 *
 * Taro 工程用 unplugin-vue-components 自动注册 `src/components` 下的组件，
 * 所以大量模板里直接写 `<SpCard>`、`<SpFormRow>`、`<Watermark>` 而没有 import。
 * uni-app x 没有这套自动注册（easycom 只认 kebab-case 目录约定），
 * 未导入的标签会退化成「未知元素」——组件样式整块丢失（例如卡片没有白底圆角）。
 *
 * 本脚本扫描模板里用到的 PascalCase 标签，缺 import 就补上。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const COMP_DIR = path.join(ROOT, 'components')

const SKIP = ['node_modules', 'unpackage', '.git', 'docs', 'scripts']

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.includes(e.name))
      continue
    const full = path.join(dir, e.name)
    if (e.isDirectory())
      walk(full, out)
    else out.push(full)
  }
  return out
}

/** sp-card → SpCard；auth-layout → AuthLayout；page-navbar → PageNavbar */
function pascal(name) {
  return name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

/** 组件名 → 文件路径（以目录名称为准） */
const registry = new Map()
for (const entry of fs.readdirSync(COMP_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory())
    continue
  const dir = entry.name
  const file = path.join(COMP_DIR, dir, `${dir}.uvue`)
  if (fs.existsSync(file))
    registry.set(pascal(dir), { dir, importPath: `@/components/${dir}/${dir}.uvue` })
}

let touched = 0
const report = []

for (const file of walk(ROOT)) {
  if (!file.endsWith('.uvue'))
    continue
  let src = fs.readFileSync(file, 'utf8')
  const tplMatch = src.match(/<template>([\s\S]*)<\/template>/)
  if (!tplMatch)
    continue
  const tpl = tplMatch[1]

  const used = new Set()
  for (const m of tpl.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g))
    used.add(m[1])

  const needed = []
  for (const name of used) {
    const entry = registry.get(name)
    if (!entry)
      continue
    // 已有 import（default 或命名）就跳过
    const imported = new RegExp(`import\\s+${name}\\s+from|import\\s*\\{[^}]*\\b${name}\\b`).test(src)
    if (imported)
      continue
    needed.push({ name, ...entry })
  }

  if (needed.length === 0)
    continue

  const imports = needed.map(n => `import ${n.name} from '${n.importPath}'`).join('\n')
  const firstImport = src.match(/^import .*$/m)
  if (firstImport) {
    src = src.replace(firstImport[0], `${firstImport[0]}\n${imports}`)
  }
  else {
    src = src.replace(/(<script[^>]*>\s*\n)/, `$1${imports}\n`)
  }
  fs.writeFileSync(file, src)
  touched++
  report.push(`${path.relative(ROOT, file)} ← ${needed.map(n => n.name).join(', ')}`)
}

console.log(`component imports: ${touched} files`)
report.slice(0, 20).forEach(r => console.log('  ' + r))
