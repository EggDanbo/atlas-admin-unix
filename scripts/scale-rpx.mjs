/**
 * 整体缩放：把所有 rpx 数值乘以一个系数
 *
 * 原工程的 750 设计稿在 390pt 屏上换算出来偏小（正文 24rpx ≈ 12.5px），
 * 这里按系数整体放大，视觉比例更接近常规移动端。
 *
 * 只处理 rpx 数值，不动 px / vw / vh / % / 颜色 / 表达式。
 * 系数通过环境变量 UI_SCALE 调整，默认 1.15。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const SCALE = Number(process.env.UI_SCALE || 1.15)
// 模板目录不参与缩放：模板存的是基准值，缩放只作用于拷贝到页面/组件后的产物
const EXTRA_DIRS = []

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

function scaleCss(css) {
  return css.replace(/(-?\d*\.?\d+)rpx\b/g, (_m, num) => {
    const v = Number(num) * SCALE
    // 保留一位小数，避免整数化导致 1rpx 边框消失
    const rounded = Math.abs(v) < 2 ? Math.round(v * 10) / 10 : Math.round(v)
    return `${rounded}rpx`
  })
}

const targets = [...walk(ROOT), ...EXTRA_DIRS.flatMap(d => (fs.existsSync(d) ? walk(d, [], []) : []))]
let files = 0
let values = 0

for (const file of targets) {
  if (!file.endsWith('.uvue'))
    continue
  const src = fs.readFileSync(file, 'utf8')
  let changed = false
  const out = src.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (m, attrs, body) => {
    const next = scaleCss(body)
    if (next !== body) {
      changed = true
      values += (body.match(/-?\d*\.?\d+rpx\b/g) || []).length
    }
    return `<style${attrs}>${next}</style>`
  })
  if (changed) {
    fs.writeFileSync(file, out)
    files++
  }
}

console.log(`scale ×${SCALE}: ${files} files, ${values} values`)
