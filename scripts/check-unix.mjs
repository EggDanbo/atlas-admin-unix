/**
 * uni-app x 产物体检
 *
 * 检查项：
 * 1. 残留 Taro / NutUI / CSS Modules 痕迹
 * 2. import 指向的文件是否存在
 * 3. 模板里是否还有 <nut-*> 组件
 * 4. 同一标签上重复的 class 属性
 * 5. pages.json 里登记的页面是否都产出了 .uvue
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

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

const files = walk(ROOT, [], ['node_modules', 'unpackage', '.git', 'docs', 'scripts'])
const code = files.filter(f => /\.(uvue|uts|json|scss)$/.test(f))
const problems = {
  taro: [],
  nutui: [],
  cssModule: [],
  missingImport: [],
  dupClass: [],
  missingPage: [],
  processEnv: [],
  typeProps: [],
  vueImport: [],
}

const rel = f => path.relative(ROOT, f)

for (const file of code) {
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    const at = `${rel(file)}:${i + 1}`
    if (/@tarojs|\bTaro\./.test(line) && !/^\s*(\*|\/\/)/.test(line))
      problems.taro.push(`${at} ${line.trim()}`)
    if (/@nutui/.test(line))
      problems.nutui.push(`${at} ${line.trim()}`)
    if (/\bstyles[.[]/.test(line))
      problems.cssModule.push(`${at} ${line.trim()}`)
    if (/process\.env/.test(line))
      problems.processEnv.push(`${at} ${line.trim()}`)
  })

  if (/<nut-/.test(text))
    problems.nutui.push(`${rel(file)} <nut-* 组件`)

  if (/defineProps\s*</.test(text))
    problems.typeProps.push(rel(file))

  if (/from 'vue'/.test(text) && file.endsWith('.uvue'))
    problems.vueImport.push(rel(file))

  // 重复 class 属性
  for (const m of text.matchAll(/<[a-zA-Z][\w-]*\b[^<>]*>/g)) {
    const count = (m[0].match(/\sclass="/g) || []).length
    if (count > 1)
      problems.dupClass.push(`${rel(file)} ${m[0].slice(0, 80)}`)
  }

  // import 路径解析
  if (file.endsWith('.uvue') || file.endsWith('.uts')) {
    for (const m of text.matchAll(/from\s+'([^']+)'/g)) {
      const spec = m[1]
      if (!spec.startsWith('@/') && !spec.startsWith('.'))
        continue
      let target = spec.startsWith('@/')
        ? path.join(ROOT, spec.slice(2))
        : path.resolve(path.dirname(file), spec)
      const candidates = [
        target,
        `${target}.uvue`,
        `${target}.uts`,
        `${target}.ts`,
        `${target}.json`,
        path.join(target, 'index.ts'),
        path.join(target, 'index.uts'),
      ]
      if (!candidates.some(c => fs.existsSync(c)))
        problems.missingImport.push(`${rel(file)} → ${spec}`)
    }
  }
}

// pages.json 页面落地检查
const pagesJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'pages.json'), 'utf8'))
for (const p of pagesJson.pages) {
  const f = path.join(ROOT, `${p.path}.uvue`)
  if (!fs.existsSync(f))
    problems.missingPage.push(p.path)
}

const summary = Object.entries(problems).map(([k, v]) => `${k}: ${v.length}`)
console.log(summary.join('\n'))
for (const [k, v] of Object.entries(problems)) {
  if (v.length === 0)
    continue
  console.log(`\n===== ${k} =====`)
  console.log(v.slice(0, 60).join('\n'))
}
