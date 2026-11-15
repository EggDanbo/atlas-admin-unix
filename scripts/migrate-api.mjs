/**
 * service/api → api/api 迁移
 *
 * Taro 版的请求层基于 alova：`request.Post<T>(url, data)` 返回一个「惰性 method」，
 * 调用方再设置 `method.meta = {...}`，await 时才真正发请求。
 * uni-app x 里没有 thenable 惰性对象，这里把 meta 折成第三个参数 options，
 * API 文件对外仍然是「调用即返回 Promise」，页面侧无需改动。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC = process.env.TARO_SRC || path.resolve(ROOT, '../atlas-admin-app/src')
const SRC_API = path.join(SRC, 'service/api')
const OUT = path.join(ROOT, 'api')

const NAMESPACES = ['Service', 'Auth', 'FileStorage', 'GuestAuth', 'WechatAuth', 'WechatWorkAuth']

function flattenTypes(code) {
  for (const ns of NAMESPACES) {
    code = code.replace(new RegExp(`\\b${ns}\\.([A-Za-z_]\\w*)`, 'g'), (_m, n) => `${ns}${n}`)
  }
  return code
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory())
      walk(full, out)
    else out.push(full)
  }
  return out
}

/** 从 openIdx（指向 '(' ）返回配对 ')' 的下标 */
function matchParen(text, openIdx) {
  let depth = 0
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i]
    if (c === '(' || c === '[' || c === '{')
      depth++
    else if (c === ')' || c === ']' || c === '}')
      depth--
    if (depth === 0)
      return i
  }
  return -1
}

/** 把 `{ params: xxx }` / `{ params }` 解成实际值 */
function unwrapParams(arg) {
  const m = arg.match(/^\{\s*params\s*:\s*([\s\S]+?)\s*\}$/)
  if (m)
    return m[1].replace(/,\s*$/, '')
  const m2 = arg.match(/^\{\s*params\s*\}$/)
  if (m2)
    return 'params'
  return null
}

/** 拆分顶层逗号参数 */
function splitArgs(raw) {
  const args = []
  let depth = 0
  let cur = ''
  for (const c of raw) {
    if ('([{<'.includes(c))
      depth++
    if (')]}>'.includes(c))
      depth--
    if (c === ',' && depth === 0) {
      args.push(cur.trim())
      cur = ''
      continue
    }
    cur += c
  }
  if (cur.trim())
    args.push(cur.trim())
  return args
}

function convertRequestCalls(code) {
  let out = ''
  let i = 0
  const re = /request\.(Get|Post|Put|Delete)\b/g
  let m
  while ((m = re.exec(code))) {
    const method = m[1]
    const callStart = m.index
    let p = callStart + m[0].length
    let generics = ''
    if (code[p] === '<') {
      let depth = 0
      let j = p
      for (; j < code.length; j++) {
        if (code[j] === '<') depth++
        else if (code[j] === '>') { depth--; if (depth === 0) { j++; break } }
      }
      generics = code.slice(p, j)
      p = j
    }
    if (code[p] !== '(')
      continue
    const close = matchParen(code, p)
    if (close < 0)
      continue
    const rawArgs = code.slice(p + 1, close)
    const args = splitArgs(rawArgs)

    const url = args[0] ?? '\"\"'
    let dataArg = null
    if (args.length > 1) {
      const unwrapped = unwrapParams(args[1])
      dataArg = unwrapped ?? args[1]
    }

    const fnName = method.toLowerCase()
    let call = `http.${fnName}${generics}(${url}${dataArg ? `, ${dataArg}` : ''}`

    // ── 回看 `const xxx = ` ──
    const prefixRaw = code.slice(i, callStart)
    const declMatch = prefixRaw.match(/const\s+([A-Za-z_$][\w$]*)\s*=\s*$/)
    let varName = null
    let prefix = prefixRaw
    if (declMatch) {
      varName = declMatch[1]
      prefix = prefixRaw.slice(0, declMatch.index)
    }

    // ── 向后跳过空白/注释，读 method.meta = {...} ──
    let after = close + 1
    const skipTrivia = (from) => {
      let k = from
      while (k < code.length) {
        const ch = code[k]
        if (/\s/.test(ch)) { k++; continue }
        if (code.startsWith('//', k)) { const nl = code.indexOf('\n', k); k = nl < 0 ? code.length : nl + 1; continue }
        if (code.startsWith('/*', k)) { const e = code.indexOf('*/', k); k = e < 0 ? code.length : e + 2; continue }
        break
      }
      return k
    }

    let meta = null
    if (varName) {
      const k = skipTrivia(after)
      if (code.startsWith(`${varName}.meta`, k)) {
        const eq = code.indexOf('=', k)
        const braceIdx = code.indexOf('{', eq)
        const braceEnd = matchParen(code, braceIdx)
        meta = code.slice(braceIdx + 1, braceEnd).trim()
        after = braceEnd + 1
      }
      // 跳过 return varName
      const k2 = skipTrivia(after)
      const retRe = new RegExp(`^return\\s+${varName}\\b`)
      const tail = code.slice(k2)
      if (retRe.test(tail)) {
        after = k2 + tail.match(retRe)[0].length
      }
    }

    if (meta)
      call += `, { ${meta.replace(/\s*\n\s*/g, ' ').replace(/,\s*$/, '')} }`
    call += ')'

    out += prefix + (varName ? 'return ' : '') + call
    i = after
    re.lastIndex = after
  }
  out += code.slice(i)
  return out
}

function transform(code) {
  code = flattenTypes(code)
  code = code.replace(/import\s+\{\s*request\s*\}\s+from\s+['"]@\/service\/http['"]/g, 'import { http } from \'@/api/http\'')
  code = code.replace(/from\s+['"](?:\.\.\/)+types\/[a-z]+['"]/g, 'from \'@/types/api.uts\'')
  code = code.replace(/from\s+['"]@\/types\/[a-z]+['"]/g, 'from \'@/types/api.uts\'')
  code = convertRequestCalls(code)
  return code
}

// 只清理上一次生成的接口文件，保留手写的 api/http 请求层
if (fs.existsSync(OUT)) {
  for (const entry of fs.readdirSync(OUT)) {
    if (entry === 'http')
      continue
    fs.rmSync(path.join(OUT, entry), { recursive: true, force: true })
  }
}

for (const file of walk(SRC_API)) {
  const rel = path.relative(SRC_API, file).replace(/\.ts$/, '.uts')
  const dest = path.join(OUT, rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, transform(fs.readFileSync(file, 'utf8')))
}

console.log('api migrated')
