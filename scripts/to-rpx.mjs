/**
 * px → rpx
 *
 * Taro 版的样式是 750 设计稿尺寸（`postcss-pxtransform`，designWidth: 750，
 * 也就是源码里的 1px 会被转成 1rpx / 0.5rem）。
 * uni-app x 里 `px` 是物理像素，不转换会整体放大约 2 倍、并撑破横向布局
 * （典型表现：标题被右边缘截断、卡片铺满整屏）。
 *
 * 因此这里把 <style> 内的 px 统一换成 rpx，还原 Taro 的设计尺度。
 *
 * 不处理的位置：
 * - 模板里的内联 :style / JS 里拼的 '32px'（Taro 的 postcss 也不处理它们，本就是物理像素）
 * - 大写 PX（Taro 里表示跳过转换的物理像素）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// scripts/templates 里是会被 post-process 拷贝到位的整文件模板，同样要处理
const EXTRA_DIRS = [path.join(ROOT, 'scripts', 'templates')]

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

function convert(css) {
  return css.replace(/(-?\d*\.?\d+)px\b/g, (m, num) => {
    // 0 / 0.0 直接归零，保持语义干净
    if (Number(num) === 0)
      return '0'
    return `${num}rpx`
  })
}

let files = 0
let hits = 0

const targets = [...walk(ROOT), ...EXTRA_DIRS.flatMap(d => (fs.existsSync(d) ? walk(d, [], []) : []))]

for (const file of targets) {
  if (!file.endsWith('.uvue'))
    continue
  const src = fs.readFileSync(file, 'utf8')
  let changed = false
  const out = src.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (m, attrs, body) => {
    const next = convert(body)
    if (next !== body) {
      changed = true
      hits += (body.match(/(-?\d*\.?\d+)px\b/g) || []).length
    }
    return `<style${attrs}>${next}</style>`
  })
  if (changed) {
    fs.writeFileSync(file, out)
    files++
  }
}

console.log(`px→rpx: ${files} files, ${hits} values`)
