/**
 * 最后一步：.uts → .ts
 *
 * HBuilderX 5.28+ 起 uni-app x 的 uvue/vue 脚本默认语言是 ts，且 main 入口同时支持
 * .uts / .ts / .js。本工程统一用 `.ts`：
 * - 5.34 的 H5 / 小程序（VDOM 模式）编译链只对 `.ts` 做转译，`.uts` 会被当普通 JS 解析而报错；
 * - App 蒸汽模式同样接受 `.ts`（原生端由 UTS 编译器接管），需要写 UTS 专属类型时再改回 `.uts` 即可。
 *
 * 该步骤幂等：已经全是 .ts 时什么都不做。
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

let renamed = 0

// 1. 改名
for (const f of walk(ROOT)) {
  if (!f.endsWith('.uts'))
    continue
  const dest = `${f.slice(0, -4)}.ts`
  fs.renameSync(f, dest)
  renamed++
}

// 2. 引用与语言标记
let touched = 0
for (const f of walk(ROOT)) {
  if (!f.endsWith('.uvue') && !f.endsWith('.ts'))
    continue
  const before = fs.readFileSync(f, 'utf8')
  const after = before
    .replace(/lang="uts"/g, 'lang="ts"')
    .replace(/(['"][^'"]*?)\.uts(['"])/g, '$1.ts$2')
  if (after !== before) {
    fs.writeFileSync(f, after)
    touched++
  }
}

// 3. index.html 入口
const html = path.join(ROOT, 'index.html')
if (fs.existsSync(html)) {
  const s = fs.readFileSync(html, 'utf8').replace('/main.uts', '/main.ts')
  fs.writeFileSync(html, s)
}

console.log(`renamed ${renamed} .uts → .ts, updated ${touched} files`)
