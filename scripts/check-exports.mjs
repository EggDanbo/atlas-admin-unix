/**
 * 命名导出体检
 *
 * Taro 版用 barrel（index.ts）聚合导出，迁移时被拍平成具体文件路径，
 * 容易出现「导入了但目标文件没有这个导出」的运行时报错（例如 PASSWORD_LOGIN）。
 * 这里做静态比对，在跑 IDE 之前把它们抓出来。
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

const files = walk(ROOT).filter(f => /\.(uvue|ts)$/.test(f))

/** 解析目标文件里可被外部导入的符号 */
const exportCache = new Map()
function exportsOf(file) {
  if (exportCache.has(file))
    return exportCache.get(file)
  const s = fs.readFileSync(file, 'utf8')
  const names = new Set()
  if (/export\s+default\b/.test(s))
    names.add('default')
  for (const m of s.matchAll(/export\s+(?:declare\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g))
    names.add(m[1])
  for (const m of s.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const t = part.trim()
      if (!t)
        continue
      const as = t.split(/\s+as\s+/)
      names.add((as[1] ?? as[0]).trim())
    }
  }
  // export * from './x' → 递归合并
  for (const m of s.matchAll(/export\s*\*\s*from\s*'([^']+)'/g)) {
    const target = resolve(file, m[1])
    if (target) {
      for (const n of exportsOf(target).names)
        names.add(n)
    }
  }
  const result = { names }
  exportCache.set(file, result)
  return result
}

function resolve(fromFile, spec) {
  if (!spec.startsWith('@/') && !spec.startsWith('.'))
    return null
  const base = spec.startsWith('@/')
    ? path.join(ROOT, spec.slice(2))
    : path.resolve(path.dirname(fromFile), spec)
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.uvue`,
    `${base}.json`,
    path.join(base, 'index.ts'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile())
      return c
  }
  const stripped = base.replace(/\.(ts|uvue|uts)$/, '')
  return [`${stripped}.ts`, `${stripped}.uvue`, path.join(stripped, 'index.ts')].find(c => fs.existsSync(c)) ?? null
}

const problems = []

for (const file of files) {
  const s = fs.readFileSync(file, 'utf8')
  for (const m of s.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+'([^']+)'/g)) {
    const isType = !!m[1]
    const spec = m[3]
    const target = resolve(file, spec)
    if (!target)
      continue
    const available = exportsOf(target).names
    for (const raw of m[2].split(',')) {
      const t = raw.trim()
      if (!t)
        continue
      const name = t.split(/\s+as\s+/)[0].replace(/^type\s+/, '').trim()
      if (!available.has(name)) {
        problems.push({
          file: path.relative(ROOT, file),
          name,
          from: spec,
          target: path.relative(ROOT, target),
          isType,
        })
      }
    }
  }
  for (const m of s.matchAll(/import\s+([A-Za-z_$][\w$]*)\s+from\s+'([^']+)'/g)) {
    const target = resolve(file, m[2])
    if (!target)
      continue
    // .uvue 用 <script setup> 时天然有 default 导出
    if (target.endsWith('.uvue'))
      continue
    if (!exportsOf(target).names.has('default')) {
      problems.push({
        file: path.relative(ROOT, file),
        name: 'default',
        from: m[2],
        target: path.relative(ROOT, target),
        isType: false,
      })
    }
  }
}

console.log(`missing exports: ${problems.length}`)
for (const p of problems.slice(0, 40))
  console.log(`${p.file} 需要 {${p.name}} ← ${p.target}${p.isType ? '（type）' : ''}`)
