import type { MockModule } from './schema.generated.ts'
import {
  APP_INFO,
  ATTENDANCE_RULES,
  CHECKIN_CURRENT,
  CHECKIN_RECORD_LIST,
  CHECKIN_RECORDS,
  CHECKIN_STATS,
  CHECKIN_TODAY,
  CONTACT_GROUPS,
  DEMO_USER,
  ENUMS,
  MESSAGES,
  PERMISSION_TREE,
  TEAM_TREE,
  USER_GROUPS,
  USER_PERMISSIONS,
  WORKFLOW_ITEMS,
} from './datasets.ts'
import { fieldValue } from './dict.ts'
import { createRng } from './random.ts'
import { MOCK_MODULES } from './schema.generated.ts'
import { resultError, resultPageSuccess, resultSuccess } from './util.ts'

const ROW_COUNT = 32

/** 演示账号密码：改密成功后更新，登录仍走 token mock */
let demoPassword = '123456'

/** 演示环境临时文件：id → 可直接展示的地址 */
const DEMO_FILES = new Map<string, string>()
let demoFileSeq = 0

const moduleByBase = new Map<string, MockModule>()
for (const mod of MOCK_MODULES) moduleByBase.set(mod.base, mod)

/** 基础路径按长度倒序，保证 atlas/staff/apply/outside 优先于 atlas/staff */
const BASES = [...moduleByBase.keys()].sort((a, b) => b.length - a.length)

function findModule(path: string): MockModule | undefined {
  for (const base of BASES) {
    if (path === base || path.startsWith(`${base}/`))
      return moduleByBase.get(base)
  }
  return undefined
}

/** 生成模块的稳定数据集 */
function rowsOf(module: MockModule): Record<string, any>[] {
  return Array.from({ length: ROW_COUNT }).map((_, i) => {
    const rng = createRng(`${module.base}#${i}`)
    const row: Record<string, any> = {
      id: `${module.base}-${i + 1}`,
      transform: {},
    }
    for (const field of module.fields) {
      if (field.key === 'id')
        continue
      row[field.key] = fieldValue(module, field, i, rng)
    }
    if (!row.code)
      row.code = fieldValue(module, { key: 'code', label: '', title: '', listOrder: 1, detailOrder: 1 }, i, rng)
    if (!row.no)
      row.no = row.code
    if (!row.name && module.page === 'staff/resume')
      row.name = fieldValue(module, { key: 'name', label: '姓名', title: '', listOrder: 1, detailOrder: 1 }, i, rng)
    if (row.status === undefined)
      row.status = String([0, 1, 2, -1][i % 4])
    if (row.stoped === undefined)
      row.stoped = String(i % 11 === 0 ? 1 : 0)
    row.team_id = String(11 + (i % 4))
    row.user_id = String(1001 + i)
    row.ctime = row.date || Date.now()
    row.utime = i % 3 === 0 ? null : row.date || Date.now()
    return row
  })
}

const rowsCache = new Map<string, Record<string, any>[]>()

function getRows(module: MockModule): Record<string, any>[] {
  const key = module.base
  if (!rowsCache.has(key))
    rowsCache.set(key, rowsOf(module))
  return rowsCache.get(key)!
}

function filterRows(rows: Record<string, any>[], keyword?: string): Record<string, any>[] {
  if (!keyword)
    return rows
  const kw = String(keyword).toLowerCase()
  return rows.filter(row =>
    Object.values(row).some(v => typeof v === 'string' && v.toLowerCase().includes(kw)),
  )
}

function paged(rows: Record<string, any>[], params: Record<string, any>) {
  const page = Number(params.page || params.pageindex || 1)
  const pageSize = Number(params.pagesize || params.pageSize || 20)
  return resultPageSuccess(page, pageSize, rows)
}

function detailPayload(module: MockModule, params: Record<string, any>) {
  const rows = getRows(module)
  const id = params.id
  const row = rows.find(r => r.id === id) || rows[Number(String(id).split('-').pop()) - 1] || rows[0]
  const detail: Record<string, any> = { ...row, transform: {} }

  detail.files = [
    {
      id: `${module.base}-file-1`,
      url: '',
      name: `${module.title}附件.pdf`,
      image: false,
      content_type: 'application/pdf',
      size: '248KB',
    },
    {
      id: `${module.base}-file-2`,
      url: '',
      name: '费用明细.xlsx',
      image: false,
      content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: '36KB',
    },
  ]

  const names = ['陈一鸣', '林知远', '周慕青', '苏亦然']
  detail.processes = [
    { step_name: '提交申请', audit_name: row.user_name || names[0], status: '已提交', remark: '', audit_time: '2026-10-26 09:24' },
    { step_name: '部门审批', audit_name: names[1], status: '已通过', remark: '同意，请按计划执行', audit_time: '2026-10-26 14:08' },
    { step_name: '财务复核', audit_name: names[2], status: '待处理', remark: '', audit_time: '' },
    { step_name: '归档', audit_name: names[3], status: '', remark: '', audit_time: '' },
  ]
  detail.current = 2
  detail.opt_confirm = true
  detail.opt_cancel = true
  detail.opt_revoke = false
  detail.opt_submit = false

  if (module.detailItemKeys.length) {
    const itemField = (key: string) => ({
      key,
      label: '',
      title: '',
      listOrder: 1,
      detailOrder: 1,
    })
    detail.list = Array.from({ length: 3 }).map((_, i) => {
      const rng = createRng(`${module.base}-item#${i}`)
      const item: Record<string, any> = {}
      for (const key of module.detailItemKeys) {
        if (key === 'files' || key === 'files_fp') {
          item[key] = []
          continue
        }
        item[key] = fieldValue(module, itemField(key), i, rng)
      }
      return item
    })
  }
  else {
    detail.list = []
  }

  return resultSuccess(detail)
}

/** 工作台指标：与「我的申请」单据状态保持一致 */
function profileStats() {
  const pending = WORKFLOW_ITEMS.filter(r => ['待审批', '审批中'].includes(r.status)).length
  const passed = WORKFLOW_ITEMS.filter(r => r.status === '已通过').length
  return [
    { label: '待处理', value: String(pending) },
    { label: '我的申请', value: String(WORKFLOW_ITEMS.length) },
    { label: '已通过', value: String(passed) },
  ]
}

/** 管理看板：待办、单据量、通过率、部门分布与近 7 日走势 */
function dashboardSummary() {
  const total = WORKFLOW_ITEMS.length
  const pending = WORKFLOW_ITEMS.filter(r => ['待审批', '审批中'].includes(r.status)).length
  const passed = WORKFLOW_ITEMS.filter(r => r.status === '已通过').length
  const back = WORKFLOW_ITEMS.filter(r => r.status === '已退回').length
  const rate = total ? Math.round((passed / total) * 100) : 0

  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const trend = weekdays.map((label, i) => ({
    label,
    value: 4 + ((i * 5 + 3) % 9),
    done: 2 + ((i * 3 + 1) % 6),
  }))

  const deptMap = new Map<string, { total: number, pending: number }>()
  for (const item of WORKFLOW_ITEMS) {
    const current = deptMap.get(item.team_name) || { total: 0, pending: 0 }
    current.total += 1
    if (['待审批', '审批中'].includes(item.status))
      current.pending += 1
    deptMap.set(item.team_name, current)
  }
  const depts = [...deptMap.entries()]
    .map(([name, v]) => ({ name, total: v.total, pending: v.pending }))
    .sort((a, b) => b.total - a.total)

  const typeMap = new Map<string, number>()
  for (const item of WORKFLOW_ITEMS)
    typeMap.set(item.biz_title, (typeMap.get(item.biz_title) || 0) + 1)
  const types = [...typeMap.entries()]
    .map(([name, value]) => ({ name, value, ratio: total ? Math.round((value / total) * 100) : 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  return {
    kpis: [
      { label: '待处理', value: String(pending), unit: '单' },
      { label: '本月单据', value: String(total), unit: '单' },
      { label: '通过率', value: String(rate), unit: '%' },
      { label: '已退回', value: String(back), unit: '单' },
    ],
    pending,
    rate,
    trend,
    depts,
    types,
  }
}

/** 我的申请：状态页签 → 单据状态 */
const APPLY_STATUS_FILTER: Record<string, string[]> = {
  wait: ['待审批'],
  progressing: ['审批中'],
  pass: ['已通过'],
  back: ['已退回'],
}

function workflowList(params: Record<string, any>, mode: 'apply' | 'approve') {
  let rows = WORKFLOW_ITEMS
  // 业务模块过滤：请假页只看 leave，加班看 overtime
  if (params.module)
    rows = rows.filter(r => r.biz_module === String(params.module))
  const status = params.status
  if (mode === 'approve') {
    const key = status || 'wait'
    if (key === 'wait')
      rows = rows.filter(r => ['待审批', '审批中'].includes(r.status))
    else if (key === 'pass')
      rows = rows.filter(r => r.status === '已通过')
    else if (key === 'back')
      rows = rows.filter(r => r.status === '已退回')
  }
  else if (status && APPLY_STATUS_FILTER[String(status)]) {
    const allow = APPLY_STATUS_FILTER[String(status)]
    rows = rows.filter(r => allow.includes(r.status))
  }
  if (params.filter) {
    const kw = String(params.filter).toLowerCase()
    rows = rows.filter(r => `${r.biz_no}${r.biz_title}${r.user_name}`.toLowerCase().includes(kw))
  }
  return paged(rows, params)
}

/** 审批流节点：提交 → 部门负责人 → 财务审核 → 归档 */
const FLOW_NODES = ['提交申请', '部门负责人审批', '财务审核', '归档']

function hhmm(offsetMinutes = 0) {
  const d = new Date(Date.now() + offsetMinutes * 60_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 根据单据状态生成审批流节点 */
function buildFlow(row: Record<string, any>) {
  const status = row.status as string
  const doneCount
    = status === '待审批' ? 1 : status === '审批中' ? 2 : status === '已通过' ? 4 : 1
  const handlers = ['陈一鸣', '林知远', '沈书言', '系统']
  const remarks = [
    '发起申请，等待审批',
    status === '已退回' ? '金额超出部门预算，请调整后重新提交' : '情况属实，同意',
    '票据齐全，同意支付',
    '流程结束，已归档',
  ]

  return FLOW_NODES.map((name, i) => {
    let state: 'done' | 'active' | 'pending' | 'error' | 'canceled' = 'pending'
    if (status === '已退回') {
      if (i === 0)
        state = 'done'
      else if (i === 1)
        state = 'error'
    }
    else if (status === '已撤回') {
      state = i === 0 ? 'done' : 'canceled'
    }
    else if (i < doneCount) {
      state = 'done'
    }
    else if (i === doneCount) {
      state = status === '已通过' ? 'done' : 'active'
    }

    return {
      name,
      handler: state === 'pending' || state === 'canceled' ? '' : handlers[i],
      // 进行中 / 待处理 / 已取消的节点还没有处理时间
      time: ['pending', 'canceled', 'active'].includes(state) ? '' : (i === 0 ? row.ctime : (row.utime || row.ctime)),
      state,
      remark: status === '已退回' && i === 1 ? remarks[1] : (state === 'done' ? remarks[i] : ''),
    }
  })
}

function workflowDetail(params: Record<string, any>) {
  const id = String(params.id || '')
  const row = WORKFLOW_ITEMS.find(r => r.id === id || r.biz_id === id) || WORKFLOW_ITEMS[0]
  return resultSuccess({ ...row, steps: buildFlow(row) })
}

function messageList(params: Record<string, any>) {
  let rows = MESSAGES
  if (params.types !== undefined && params.types !== null && params.types !== '')
    rows = rows.filter(r => String(r.types) === String(params.types))
  if (params.read === '未读' || params.unread === true)
    rows = rows.filter(r => !r.utime)
  if (params.filter) {
    const kw = String(params.filter).toLowerCase()
    rows = rows.filter(r => `${r.title}${r.content}`.toLowerCase().includes(kw))
  }
  return paged(rows, params)
}

function organUsers(params: Record<string, any>) {
  const names = ['陈一鸣', '林知远', '周慕青', '苏亦然', '沈书言', '赵清和', '顾南乔', '许望舒', '唐屿', '何晏', '郑融', '韩沐']
  const teams = ['技术中心', '财务部', '人力资源部', '客户成功部']
  const rows = names.map((name, i) => ({
    user_id: String(1001 + i),
    id: String(1001 + i),
    code: `atlas${String(i + 1).padStart(3, '0')}`,
    name,
    abbr: name.slice(1),
    team_id: String(11 + (i % 4)),
    team_name: teams[i % teams.length],
    room_name: ['产品研发组', '平台工程组', '核算组', '招聘组'][i % 4],
    mobile: `1380013${String(8000 + i)}`,
    mobile_number: `1380013${String(8000 + i)}`,
    position: ['工程师', '高级工程师', '主管', '经理'][i % 4],
    types: 1,
    // 演示账号（陈一鸣）保持在职，只在后面几位里造两个停用
    stoped: i > 2 && i % 4 === 0 ? 1 : 0,
  }))
  return paged(rows, params)
}

/** 供路由与巡检使用的数据摘要 */
export function summary() {
  return {
    modules: MOCK_MODULES.length,
    fields: MOCK_MODULES.reduce((n, m) => n + m.fields.length, 0),
    workflow: WORKFLOW_ITEMS.length,
    messages: MESSAGES.length,
  }
}

/**
 * 本地数据引擎：根据请求路径返回结构化数据
 */
/**
 * 本地数据引擎入口
 *
 * @param url  请求路径（已去掉域名与查询串，大小写不敏感）
 * @param body 请求参数（GET 的 params 与 POST 的 data 已在请求层合并）
 */
export function respond(url: string, body: Record<string, any>): any {
  const path = url
    .replace(/^\/+/, '')
    .replace(/^atlasapi\//, '')
    .replace(/^atlas\//, '')
    .toLowerCase()
  const params: Record<string, any> = body != null ? body : {}

  // ==================== 认证 ====================
  if (path.includes('authorize/tokensafety')) {
    if (!params.username)
      return resultError('请输入用户名')
    return resultSuccess({
      access_token: 'atlas-demo-access-token',
      token_type: 'Bearer',
      expires_in: 7200,
      refresh_token: 'atlas-demo-refresh-token',
      bound: true,
    })
  }
  if (path.includes('authorize/refreshtoken')) {
    return resultSuccess({
      access_token: 'atlas-demo-access-token',
      token_type: 'Bearer',
      expires_in: 7200,
      refresh_token: 'atlas-demo-refresh-token',
    })
  }
  if (path.includes('authorize/untoken') || path.includes('authorize/sms') || path.includes('authorize/sendverifycode'))
    return resultSuccess(null)

  // ==================== 身份与权限 ====================
  if (path.includes('identity/profile/get'))
    return resultSuccess({ ...DEMO_USER })
  if (path.includes('identity/profile/info'))
    return resultSuccess({ ...DEMO_USER })
  if (path.includes('identity/profile/stats'))
    return resultSuccess(profileStats())
  if (path.includes('identity/profile/updateface')) {
    // 人脸采集：把上传后的照片地址回写，页面重新拉取 info 即可看到新照片
    const pic = String(params.image_pic || '')
    const url = String(params.image_url || DEMO_FILES.get(pic) || '')
    DEMO_USER.face_pic = pic || DEMO_USER.face_pic
    DEMO_USER.face_url = url || DEMO_USER.face_url
    DEMO_USER.faceurl = DEMO_USER.face_url
    DEMO_USER.face_utime = hhmm()
    return resultSuccess('ok')
  }
  if (path.includes('identity/profile/updateprofile')) {
    // 演示环境把修改写回内存用户，保存后「我的」与个人信息页即时生效
    const editable = ['name', 'mobile_number', 'id_no', 'wkno', 'code', 'team_id', 'team_name', 'working'] as const
    for (const key of editable) {
      if (params[key] !== undefined && params[key] !== null)
        (DEMO_USER as Record<string, any>)[key] = params[key]
    }
    if (params.user_pic)
      DEMO_USER.user_pic = String(params.user_pic)
    if (params.user_url) {
      DEMO_USER.user_url = String(params.user_url)
      DEMO_USER.avatarurl = String(params.user_url)
    }
    return resultSuccess('ok')
  }
  if (path.includes('identity/profile/changepassword')) {
    const oldpwd = String(params.oldpassword || '')
    const newpwd = String(params.newpassword || '')
    if (oldpwd !== demoPassword)
      return resultError('旧密码不正确')
    if (newpwd.length < 6)
      return resultError('新密码长度不能少于 6 位')
    demoPassword = newpwd
    return resultSuccess('ok')
  }
  if (path.includes('identity/profile/'))
    return resultSuccess(null)
  if (path.includes('identity/permit/list'))
    return resultSuccess(PERMISSION_TREE)
  if (path.includes('identity/permit/currentuser'))
    return resultSuccess(USER_PERMISSIONS)
  if (path.includes('identity/permit') || path.includes('permituser'))
    return resultSuccess(null)

  // ==================== 应用信息与枚举 ====================
  if (path.includes('common/appinfo'))
    return resultSuccess({ ...APP_INFO })
  if (path.includes('common/enums'))
    return resultSuccess(ENUMS)

  // ==================== 消息 / 待办 ====================
  if (path.includes('message/my/search'))
    return messageList(params)
  if (path.includes('message/my/getunread'))
    return resultSuccess(MESSAGES.filter(m => !m.utime).length)
  if (path.includes('message/my/readall')) {
    for (const item of MESSAGES) {
      if (!item.utime) {
        item.utime = hhmm()
        item.read = 1
      }
    }
    return resultSuccess('ok')
  }
  if (path.includes('message/my/read')) {
    const id = String(params.value || params.id || '')
    const row = MESSAGES.find(m => String(m.id) === id)
    if (!row)
      return resultError('消息不存在')
    if (!row.utime)
      row.utime = hhmm()
    row.read = 1
    return resultSuccess('ok')
  }
  if (path.includes('message/my'))
    return resultSuccess(null)

  // ==================== 工作流 ====================
  if (path.includes('workflow/apply/search'))
    return workflowList(params, 'apply')
  if (path.includes('workflow/apply/get'))
    return workflowDetail(params)
  if (path.includes('workflow/apply/revoke')) {
    const id = String(params.id || '')
    const row = WORKFLOW_ITEMS.find(r => r.id === id || r.biz_id === id)
    if (!row)
      return resultError('单据不存在')
    if (!['待审批', '审批中'].includes(row.status))
      return resultError('当前状态不可撤回')
    row.status = '已撤回'
    row.title = `${row.biz_title}已撤回`
    row.utime = hhmm()
    return resultSuccess('撤回成功')
  }
  if (path.includes('workflow/approve/search'))
    return workflowList(params, 'approve')
  if (path.includes('workflow/approve/process')) {
    const id = String(params.id || '')
    const action = String(params.action || 'pass')
    const row = WORKFLOW_ITEMS.find(r => r.id === id || r.biz_id === id)
    if (!row)
      return resultError('单据不存在')
    if (!['待审批', '审批中'].includes(row.status))
      return resultError('该单据已处理')
    row.status = action === 'back' ? '已退回' : '已通过'
    row.title = `${row.biz_title}${row.status}`
    row.utime = hhmm()
    return resultSuccess('处理成功')
  }
  if (path.includes('workflow/'))
    return resultSuccess(null)

  // ==================== 管理看板 ====================
  if (path.includes('dashboard/summary'))
    return resultSuccess(dashboardSummary())

  // ==================== 组织 ====================
  if (path.includes('organ/team/tree'))
    return resultSuccess(TEAM_TREE)
  if (path.includes('organ/user/search') || path.includes('organ/user/getlist'))
    return organUsers(params)
  if (path.includes('organ/user/get')) {
    return resultSuccess({
      ...DEMO_USER,
      card: '310***********1234',
      id_no: '310***********1234',
      birthday: Date.UTC(1992, 4, 18),
      gender: '1',
      black: 0,
      reason: '',
      email: 'demo@example.com',
    })
  }
  if (path.includes('organ/team/search') || path.includes('organ/room/search') || path.includes('organ/outer/search')) {
    return paged(TEAM_TREE.flatMap((n, i) => (n.children || []).map((c, j) => ({
      id: `${i}-${j}`,
      code: `T${i}${j}`,
      name: c.text,
      team_name: c.text,
      lead_name: ['陈一鸣', '林知远', '周慕青'][(i + j) % 3],
      mobile: `1380013${String(8000 + i * 3 + j)}`,
      stoped: 0,
    }))), params)
  }
  if (path.startsWith('organ/'))
    return resultSuccess(null)

  // ==================== 打卡（新版页面） ====================
  if (path.startsWith('checkin/records'))
    return paged(CHECKIN_RECORD_LIST, params)
  if (path.startsWith('checkin/stats'))
    return resultSuccess(CHECKIN_STATS)
  // ==================== 通讯录 ====================
  if (path.startsWith('contact'))
    return resultSuccess(CONTACT_GROUPS)
  // ==================== 通用申请（请假 / 加班） ====================
  if (path.startsWith('apply/submit')) {
    const isOvertime = String(params.type) === 'overtime'
    const prefix = isOvertime ? 'JB' : 'QJ'
    const no = `${prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
    // 提交后立刻出现在「请假申请 / 我的申请」列表顶部
    const kind = String(params.kind || (isOvertime ? '加班' : '请假'))
    WORKFLOW_ITEMS.unshift({
      id: `workflow-${Date.now()}`,
      biz_id: `${isOvertime ? 'staff/overtime' : 'staff/leave'}-${Date.now()}`,
      biz_no: no,
      biz_name: isOvertime ? 'staff_overtime' : 'staff_leave',
      biz_route: '',
      biz_title: isOvertime ? '加班申请' : `${kind.replace('申请', '')}申请`,
      biz_category: '人事',
      biz_module: isOvertime ? 'overtime' : 'leave',
      biz_status: 0,
      status: '待审批',
      title: `${isOvertime ? '加班申请' : `${kind}申请`}待处理`,
      team_name: '技术中心',
      user_name: '陈一鸣',
      ctime: hhmm(),
      utime: null,
      types: 0,
    })
    return resultSuccess({ ok: true, no })
  }
  if (path.startsWith('checkin/status') || path.startsWith('checkin/submit')) {
    if (path.startsWith('checkin/submit')) {
      const type = String(params.type || 'in')
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      if (type === 'in' && !CHECKIN_TODAY.today.inTime)
        CHECKIN_TODAY.today.inTime = time
      else if (type === 'out' && !CHECKIN_TODAY.today.outTime)
        CHECKIN_TODAY.today.outTime = time
    }
    return resultSuccess(CHECKIN_TODAY)
  }

  // ==================== 考勤 ====================
  if (path.includes('staff/apply/query/getstatus')) {
    return resultSuccess([
      { text: '全部', value: '' },
      { text: '待审批', value: '0' },
      { text: '已通过', value: '1' },
      { text: '已退回', value: '2' },
      { text: '已撤销', value: '3' },
    ])
  }
  if (path.includes('staff/checkin/usergroup'))
    return resultSuccess(USER_GROUPS)
  // ==================== 考勤规则（管理端） ====================
  if (path.startsWith('rules/list')) {
    let rows = ATTENDANCE_RULES
    if (params.status !== undefined && params.status !== null && params.status !== '')
      rows = rows.filter(r => String(r.status) === String(params.status))
    if (params.filter) {
      const kw = String(params.filter).toLowerCase()
      rows = rows.filter(r => `${r.name}${r.scope}`.toLowerCase().includes(kw))
    }
    return paged(rows, params)
  }
  if (path.startsWith('rules/get')) {
    const row = ATTENDANCE_RULES.find(r => r.id === String(params.id))
    return row ? resultSuccess(row) : resultError('规则不存在')
  }
  if (path.startsWith('rules/create')) {
    const id = `rule-${Date.now()}`
    ATTENDANCE_RULES.unshift({
      id,
      name: String(params.name || '未命名规则'),
      mode: ['fixed', 'free', 'shift'].includes(String(params.mode)) ? String(params.mode) : 'fixed',
      status: 1,
      scope: String(params.scope || '全员'),
      member_count: 0,
      work_days: Array.isArray(params.work_days) ? params.work_days : [1, 2, 3, 4, 5],
      start: String(params.start || '09:00'),
      end: String(params.end || '18:00'),
      rest: String(params.rest || '12:00-13:00'),
      flex: !!params.flex,
      flex_minutes: Number(params.flex_minutes || 0),
      work_hours: Number(params.work_hours || 8),
      free_times: Number(params.free_times || 2),
      latest: String(params.latest || '21:00'),
      shifts: Array.isArray(params.shifts) ? params.shifts : [],
      members: Array.isArray(params.members) ? params.members : [],
      assignments: Array.isArray(params.assignments) ? params.assignments : [],
      handover_minutes: Number(params.handover_minutes ?? 30),
      ways: Array.isArray(params.ways) ? params.ways : ['GPS 定位'],
      gps_range: Number(params.gps_range || 300),
      address: String(params.address || '杭州市西湖区文三路 100 号'),
      make_up: Number(params.make_up ?? 3),
      ctime: hhmm(),
      utime: hhmm(),
    })
    return resultSuccess(id)
  }
  if (path.startsWith('rules/update')) {
    const row = ATTENDANCE_RULES.find(r => r.id === String(params.id))
    if (!row)
      return resultError('规则不存在')
    Object.assign(row, params, { utime: hhmm() })
    return resultSuccess('ok')
  }
  if (path.startsWith('rules/toggle')) {
    const row = ATTENDANCE_RULES.find(r => r.id === String(params.id))
    if (!row)
      return resultError('规则不存在')
    row.status = row.status === 1 ? 0 : 1
    row.utime = hhmm()
    return resultSuccess(row.status)
  }

  if (path.includes('staff/checkin/schedule'))
    return resultSuccess([{ value: 'A', text: '09:00 - 18:00' }, { value: 'B', text: '10:00 - 19:00' }])
  if (path.includes('staff/checkin/current'))
    return resultSuccess({ ...CHECKIN_CURRENT })
  if (path.includes('staff/checkin/submit') || path.includes('staff/checkin/qrcode'))
    return resultSuccess({ ok: true })
  if (path.includes('staff/checkin/user/everyday') || path.includes('staff/checkin/user/detail'))
    return resultSuccess(CHECKIN_RECORDS)
  if (path.includes('staff/checkin/detail'))
    return resultSuccess(CHECKIN_RECORDS)
  if (path.includes('staff/checkin'))
    return resultSuccess({ ...CHECKIN_CURRENT })

  // ==================== 字典 ====================
  if (path.includes('dictionary')) {
    return resultSuccess([
      {
        id: 'root',
        name: '业务字典',
        depth: 0,
        child: [
          { id: 'expense', name: '费用类型', depth: 1, child: [] },
          { id: 'asset', name: '资产分类', depth: 1, child: [] },
        ],
      },
    ])
  }

  // ==================== 地图 ====================
  if (path.includes('map/geocode')) {
    return resultSuccess({
      list: [{ lng: 120.15507, lat: 30.274084, address: 'Atlas 总部园区' }],
      address: 'Atlas 总部园区',
    })
  }

  // ==================== 文件 / 草稿 ====================
  if (path.includes('file/resource/uploadimagetemp') || path.includes('file/resource/uploadimage')) {
    const base64 = String(params.data || '')
    const id = `demo-file-${++demoFileSeq}`
    const url = base64 ? `data:image/jpeg;base64,${base64}` : ''
    if (url)
      DEMO_FILES.set(id, url)
    return resultSuccess({
      id,
      url,
      name: String(params.name || 'face.jpg'),
      image: true,
      content_type: 'image/jpeg',
      size: String(base64.length),
    })
  }
  if (path.includes('file/') || path.includes('draftbox/'))
    return resultSuccess(null)

  // ==================== 业务模块 ====================
  const module = findModule(path)
  if (module) {
    if (path.endsWith('/search') || path.endsWith('/getlist') || path.endsWith('/list'))
      return paged(filterRows(getRows(module), params.filter), params)
    if (path.endsWith('/get') || path.endsWith('/detail') || path.endsWith('/getinfo'))
      return detailPayload(module, params)
    if (path.endsWith('/tree'))
      return resultSuccess(TEAM_TREE)
    if (path.endsWith('/searchuser') || path.endsWith('/user'))
      return organUsers(params)
    return resultSuccess(null)
  }

  // 未识别接口：返回空成功，保证演示不出现红色报错
  return resultSuccess(null)
}

export { MOCK_MODULES }
