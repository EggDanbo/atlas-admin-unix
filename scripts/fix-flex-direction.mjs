/**
 * 补 flex-direction: row
 *
 * uni-app x 在所有端做了一次 CSS 重置：`view` 默认 `display: flex; flex-direction: column`
 * （W3C 是 block，flex 默认 row）。原 Taro 样式中大量写法是
 *
 *   .row { display: flex; align-items: center; }
 *
 * 依赖浏览器默认的 **row**，迁移到 uni-app x 后会变成竖向排列，整片布局错位。
 * 这里给「有 display: flex 但没有 flex-direction」的规则补上 `flex-direction: row`。
 *
 * 幂等：已有 flex-direction 的规则不动。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

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

function fixCss(css) {
  let fixed = 0
  const out = css.replace(/([^{}]+)\{([^{}]*)\}/g, (m, selector, body) => {
    if (!/display\s*:\s*(inline-)?flex\s*;?/.test(body))
      return m
    if (/flex-direction\s*:/.test(body))
      return m
    // 在 display 那一行后面插入 flex-direction，保持缩进
    const next = body.replace(
      /(^|\n)([ \t]*)display\s*:\s*(inline-)?flex\s*;?/,
      (line, br, indent, inline) => {
        const dir = inline ? 'row' : 'row'
        return `${br}${indent}display: ${inline ? 'inline-flex' : 'flex'};\n${indent}flex-direction: ${dir};`
      },
    )
    if (next === body)
      return m
    fixed++
    return `${selector}{${next}}`
  })
  return { out, fixed }
}

let files = 0
let total = 0

for (const file of walk(ROOT)) {
  if (!file.endsWith('.uvue'))
    continue
  const src = fs.readFileSync(file, 'utf8')
  let changed = false
  let count = 0
  const out = src.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (m, attrs, body) => {
    const r = fixCss(body)
    if (r.fixed > 0) {
      changed = true
      count += r.fixed
    }
    return `<style${attrs}>${r.out}</style>`
  })
  if (changed) {
    fs.writeFileSync(file, out)
    files++
    total += count
  }
}

console.log(`flex-direction: ${files} files, ${total} rules`)
