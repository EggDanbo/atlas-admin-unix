/** Atlas 演示数据：应用信息、枚举、权限、组织、消息、工作流、考勤 */

export const DEMO_USER = {
  userid: '10001',
  code: 'demo',
  name: '陈一鸣',
  nickname: '一鸣',
  avatarurl: '',
  faceurl: '',
  mobile_number: '13800138000',
  wkno: 'AT-0001',
  id_no: '330102199403074512',
  watermark: false,
  types: 1,
  kind: 0,
  can_modify_pass: true,
  authrole: ['admin'],
  team_id: '111',
  team_name: '技术中心/产品研发组',
  working: true,
  user_pic: '',
  user_url: '',
  face_pic: '',
  face_url: '',
  face_utime: '',
}

export const APP_INFO = {
  appname: 'Atlas 工作台',
  companyname: 'Atlas Demo',
  longitude: 120.15507,
  latitude: 30.274084,
  pagelimit: 20,
  logincaptcha: false,
  version: '2.4.0',
}

/** 权限码：与页面菜单、按钮使用的编码保持一致 */
const PERMISSION_CODES = [
  'ATLAS_BASE',
  'ATLAS_BASE_VIEW',
  'ATLAS_BASE_EDIT',
  'ATLAS_APPROVE',
  'ATLAS_APPROVE_PENSE',
  'ATLAS_APPROVE_DONE',
  'ATLAS_ASSET_INFO',
  'ATLAS_PENSE_CONTRACT',
  'ATLAS_STAFF_CHECKIN_RULES',
  'ATLAS_STAFF_RESUME',
  'ATLAS_STAFF_RESUME_ADD',
  'ATLAS_STAFF_RESUME_EDIT',
  'ATLAS_STAFF_RESUME_DELE',
  'ATLAS_TRADE_CUSTOM',
  'ATLAS_TRADE_PROJECT',
]

export const USER_PERMISSIONS = PERMISSION_CODES

export const PERMISSION_TREE = [
  {
    id: 'ATLAS_BASE',
    title: '基础权限',
    children: [
      { id: 'ATLAS_BASE_VIEW', title: '查看', children: [] },
      { id: 'ATLAS_BASE_EDIT', title: '编辑', children: [] },
    ],
  },
  {
    id: 'ATLAS_APPROVE',
    title: '审批管理',
    children: [
      { id: 'ATLAS_APPROVE_PENSE', title: '费用审批', children: [] },
      { id: 'ATLAS_APPROVE_DONE', title: '已办事项', children: [] },
    ],
  },
  {
    id: 'ATLAS_ASSET_INFO',
    title: '资产信息',
    children: [],
  },
  {
    id: 'ATLAS_PENSE_CONTRACT',
    title: '付款合同',
    children: [],
  },
  {
    id: 'ATLAS_STAFF_RESUME',
    title: '人员简历',
    children: [
      { id: 'ATLAS_STAFF_RESUME_ADD', title: '新增', children: [] },
      { id: 'ATLAS_STAFF_RESUME_EDIT', title: '编辑', children: [] },
      { id: 'ATLAS_STAFF_RESUME_DELE', title: '删除', children: [] },
    ],
  },
  {
    id: 'ATLAS_STAFF_CHECKIN_RULES',
    title: '考勤设置',
    children: [],
  },
  {
    id: 'ATLAS_TRADE_CUSTOM',
    title: '客户信息',
    children: [],
  },
  {
    id: 'ATLAS_TRADE_PROJECT',
    title: '服务项目',
    children: [],
  },
]

function enumOf(name: string, labels: string[], start = 0): SystemEnums {
  return {
    name,
    items: labels.map((label, i) => ({
      name: `ITEM_${i}`,
      label,
      value: String(start + i),
    })),
  }
}

/** 单据状态：-1 红（退回/作废）、0 橙（待办）、1 橙（进行中）、2 绿（完成） */
function statusEnum(name: string, labels: Record<string, string>): SystemEnums {
  return enumOfPairs(name, Object.entries(labels))
}

function enumOfPairs(name: string, pairs: Array<[string, string]>): SystemEnums {
  return {
    name,
    items: pairs.map(([value, label]) => ({ name: `ITEM_${value}`, label, value })),
  }
}

export const ENUMS: Record<string, SystemEnums> = {
  workflow_process_status: statusEnum('workflow_process_status', { '-1': '已退回', '0': '待审批', '1': '审批中', '2': '已通过' }),
  asset_bill_status: statusEnum('asset_bill_status', { '-1': '已作废', '0': '待审批', '1': '审批中', '2': '已完成' }),
  asset_info_status: statusEnum('asset_info_status', { '-1': '已报废', '0': '使用中', '1': '维修中', '2': '正常' }),
  asset_info_source: enumOf('asset_info_source', ['采购', '租赁', '调拨', '捐赠']),
  asset_info_method: enumOf('asset_info_method', ['平均年限法', '双倍余额递减法', '工作量法']),
  paper_borrow_status: statusEnum('paper_borrow_status', { '-1': '已逾期', '0': '待审批', '1': '借阅中', '2': '已归还' }),
  paper_borrow_types: enumOf('paper_borrow_types', ['内部借阅', '外部借阅']),
  pense_bill_status: statusEnum('pense_bill_status', { '-1': '已作废', '0': '待审批', '1': '审批中', '2': '已支付' }),
  pense_travel_types: enumOf('pense_travel_types', ['国内出差', '境外出差']),
  pense_contract_types: enumOf('pense_contract_types', ['采购合同', '服务合同', '租赁合同', '框架协议']),
  pense_contract_source: enumOf('pense_contract_source', ['公开招标', '邀请议标', '直接采购']),
  pense_contract_states: enumOf('pense_contract_states', ['待生效', '生效中', '已到期', '已终止']),
  pense_contract_status: statusEnum('pense_contract_status', { '-1': '已作废', '0': '草稿', '1': '审批中', '2': '已生效' }),
  pense_contract_payment: enumOf('pense_contract_payment', ['月结', '季结', '一次性支付']),
  staff_bill_status: statusEnum('staff_bill_status', { '-1': '已撤销', '0': '待审批', '1': '审批中', '2': '已完成' }),
  staff_because_types: enumOf('staff_because_types', ['奖励', '处罚']),
  staff_promote_types: enumOf('staff_promote_types', ['晋级', '晋档', '降级']),
  staff_resume_status: statusEnum('staff_resume_status', { '-1': '已离职', '0': '待入职', '1': '试用期', '2': '在职' }),
  organ_user_gender: enumOf('organ_user_gender', ['男', '女'], 1),
  checkin_apply_status: statusEnum('checkin_apply_status', { '-1': '已退回', '0': '待审批', '1': '审批中', '2': '已通过' }),
  checkin_outside_types: enumOf('checkin_outside_types', ['因公外出', '因私外出']),
  checkin_vacation_types: enumOf('checkin_vacation_types', ['事假', '病假', '年假', '调休']),
  checkin_overtime_types: enumOf('checkin_overtime_types', ['工作日加班', '休息日加班', '节假日加班']),
  trade_project_status: statusEnum('trade_project_status', { '0': '草稿', '1': '审批中', '2': '执行中', '3': '已完成', '-1': '已终止' }),
  trade_project_types: enumOf('trade_project_types', ['物业服务', '咨询服务', '技术服务', '运营服务']),
  trade_project_source: enumOf('trade_project_source', ['公开招标', '邀请招标', '直接委托']),
  trade_project_states: enumOf('trade_project_states', ['筹备中', '进行中', '已验收', '已终止']),
  trade_project_pattern: enumOf('trade_project_pattern', ['固定总价', '人月计费', '按量结算']),
}

export const TEAM_TREE = [
  {
    value: '1',
    text: 'Atlas 总部',
    children: [
      {
        value: '11',
        text: '技术中心',
        children: [
          { value: '111', text: '产品研发组' },
          { value: '112', text: '平台工程组' },
          { value: '113', text: '质量保障组' },
        ],
      },
      {
        value: '12',
        text: '财务部',
        children: [
          { value: '121', text: '核算组' },
          { value: '122', text: '资金组' },
        ],
      },
      {
        value: '13',
        text: '人力资源部',
        children: [
          { value: '131', text: '招聘组' },
          { value: '132', text: '员工关系组' },
        ],
      },
      {
        value: '14',
        text: '客户成功部',
        children: [
          { value: '141', text: '交付组' },
          { value: '142', text: '服务组' },
        ],
      },
    ],
  },
  {
    value: '2',
    text: '华东分部',
    children: [
      { value: '21', text: '销售部' },
      { value: '22', text: '实施部' },
    ],
  },
]

const TEAM_NAMES = ['技术中心', '财务部', '人力资源部', '客户成功部', '华东分部']

/**
 * 申请单据类型
 *
 * 演示版不再挂具体业务详情页，「我的申请」统一展示这些单据，
 * category 用于列表上的分类标签。
 */
const BIZ_ROUTES = [
  { route: '', name: 'pense_apply', title: '差旅费报销', category: '费用', module: 'expense' },
  { route: '', name: 'pense_order', title: '办公用品采购', category: '费用', module: 'expense' },
  { route: '', name: 'pense_travel', title: '客户拜访出差', category: '费用', module: 'expense' },
  { route: '', name: 'pense_traffic', title: '交通费报销', category: '费用', module: 'expense' },
  { route: '', name: 'asset_apply', title: '研发设备申领', category: '资产', module: 'asset' },
  { route: '', name: 'asset_order', title: '服务器采购', category: '资产', module: 'asset' },
  { route: '', name: 'asset_repair', title: '打印机维保', category: '资产', module: 'asset' },
  { route: '', name: 'staff_vacation', title: '年假申请', category: '人事', module: 'leave' },
  { route: '', name: 'staff_leave', title: '事假申请', category: '人事', module: 'leave' },
  { route: '', name: 'staff_sick', title: '病假申请', category: '人事', module: 'leave' },
  { route: '', name: 'staff_overtime', title: '周末加班', category: '人事', module: 'overtime' },
  { route: '', name: 'paper_borrow', title: '合同档案借阅', category: '档案', module: 'paper' },
]

const PEOPLE = ['陈一鸣', '林知远', '周慕青', '苏亦然', '沈书言', '赵清和', '顾南乔', '许望舒']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function fmt(offsetDays: number, hour = 9): string {
  const base = Date.UTC(2026, 10, 1, hour, 20, 0) - offsetDays * 86400000
  const d = new Date(base)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(hour)}:${pad((offsetDays * 7) % 60)}`
}

/** 工作流待办/已办 */
export const WORKFLOW_ITEMS = Array.from({ length: 26 }).map((_, i) => {
  const biz = BIZ_ROUTES[i % BIZ_ROUTES.length]
  const statusIndex = i % 4
  return {
    id: `workflow-${i + 1}`,
    biz_id: `${biz.route}-${(i % 20) + 1}`,
    biz_no: `WF-2026-${String(1001 + i * 3).padStart(4, '0')}`,
    biz_name: biz.name,
    biz_route: biz.route,
    biz_title: biz.title,
    biz_category: biz.category,
    biz_module: biz.module,
    biz_status: statusIndex === 0 ? 0 : 1,
    status: ['待审批', '审批中', '已通过', '已退回'][statusIndex],
    title: `${biz.title}待处理`,
    team_name: TEAM_NAMES[i % TEAM_NAMES.length],
    user_name: PEOPLE[i % PEOPLE.length],
    ctime: fmt(i),
    utime: statusIndex === 0 ? null : fmt(i, 15),
    types: statusIndex === 0 ? 0 : 1,
  }
})

/** 消息中心 */
export const MESSAGES = Array.from({ length: 24 }).map((_, i) => {
  const biz = BIZ_ROUTES[(i + 3) % BIZ_ROUTES.length]
  const types = i % 3
  return {
    id: `message-${i + 1}`,
    title: types === 0 ? `${biz.title}待你审批` : types === 1 ? `${biz.title}已通过` : '系统维护通知',
    content: types === 0
      ? `「${biz.title}」有一条新的审批任务，请及时处理。`
      : types === 1
        ? `你提交的「${biz.title}」已完成审批，可查看详情。`
        : '平台将于本周日 02:00 进行例行维护，预计 30 分钟。',
    types,
    read: i % 4 === 0 ? 0 : 1,
    ctime: fmt(i, 10),
    utime: i % 4 === 0 ? null : fmt(i, 11),
    biz_id: `${biz.route}-${(i % 20) + 1}`,
    biz_name: biz.name,
    biz_route: biz.route,
    biz_title: biz.title,
  }
})

/** 考勤设置 */
/** 生成本月按人排班：每人按班次轮换，周日休息；夜班次日不排其它班次，避免跨天冲突 */
function buildTeamRoster(members: string[], shiftNames: string[]) {
  const rows: { member: string, date: string, shift: string }[] = []
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const days = new Date(year, month + 1, 0).getDate()
  const lastShift: Record<string, string> = {}

  for (let day = 1; day <= days; day++) {
    const weekday = new Date(year, month, day).getDay()
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    members.forEach((member, index) => {
      let shift = shiftNames[(index + day) % shiftNames.length]
      if (weekday === 0)
        shift = '休息'
      if (lastShift[member] === '夜班' && shift !== '夜班')
        shift = '休息'
      rows.push({ member, date, shift })
      lastShift[member] = shift
    })
  }
  return rows
}

/** 考勤规则：参照企业微信 / 钉钉的考勤组设置建模，覆盖固定班次 / 自由打卡 / 排班制三种模式 */
export const ATTENDANCE_RULES = [
  {
    id: 'rule-1',
    name: '总部固定班次',
    mode: 'fixed',
    status: 1,
    scope: '技术中心 / 财务部',
    member_count: 126,
    work_days: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '18:00',
    rest: '13:00-14:00',
    flex: false,
    flex_minutes: 0,
    work_hours: 8,
    free_times: 2,
    latest: '21:00',
    shifts: [
      { name: '标准班', start: '09:00', end: '18:00', cross: false, rest: '13:00-14:00', work_days: [1, 2, 3, 4, 5] },
    ],
    members: [],
    assignments: [],
    handover_minutes: 30,
    ways: ['GPS 定位', 'Wi-Fi'],
    gps_range: 300,
    address: '杭州市西湖区文三路 100 号',
    make_up: 3,
    ctime: '2026-01-05 10:00',
    utime: '2026-10-21 09:12',
  },
  {
    id: 'rule-2',
    name: '研发弹性班次',
    mode: 'fixed',
    status: 1,
    scope: '技术中心 / 产品研发组',
    member_count: 48,
    work_days: [1, 2, 3, 4, 5, 6],
    start: '10:00',
    end: '19:00',
    rest: '14:00-15:00',
    flex: true,
    flex_minutes: 30,
    work_hours: 8,
    free_times: 2,
    latest: '22:00',
    shifts: [
      { name: '弹性班', start: '10:00', end: '19:00', cross: false, rest: '14:00-15:00', work_days: [1, 2, 3, 4, 5] },
      { name: '周六值班', start: '10:00', end: '16:00', cross: false, rest: '13:00-14:00', work_days: [6] },
    ],
    members: [],
    assignments: [],
    handover_minutes: 30,
    ways: ['GPS 定位', 'Wi-Fi', '人脸识别'],
    gps_range: 500,
    address: '杭州市西湖区文三路 100 号',
    make_up: 5,
    ctime: '2026-02-11 14:20',
    utime: '2026-10-18 16:40',
  },
  {
    id: 'rule-3',
    name: '客服轮班制',
    mode: 'shift',
    status: 1,
    scope: '客户成功部',
    member_count: 6,
    work_days: [],
    start: '08:00',
    end: '17:00',
    rest: '12:00-13:00',
    flex: false,
    flex_minutes: 0,
    work_hours: 8,
    free_times: 2,
    latest: '21:00',
    shifts: [
      { name: '早班', start: '08:00', end: '17:00', cross: false, rest: '12:00-13:00', work_days: [] },
      { name: '中班', start: '12:00', end: '21:00', cross: false, rest: '16:00-17:00', work_days: [] },
      { name: '晚班', start: '22:00', end: '06:00', cross: true, rest: '01:30-02:30', work_days: [] },
    ],
    members: ['王琳', '李哲', '周舟', '陈默', '赵敏', '孙浩'],
    assignments: buildTeamRoster(['王琳', '李哲', '周舟', '陈默', '赵敏', '孙浩'], ['早班', '中班', '晚班']),
    handover_minutes: 30,
    ways: ['GPS 定位'],
    gps_range: 200,
    address: '杭州市滨江区江南大道 588 号',
    make_up: 2,
    ctime: '2026-03-02 09:30',
    utime: '2026-09-30 11:05',
  },
  {
    id: 'rule-4',
    name: '外勤自由打卡',
    mode: 'free',
    status: 0,
    scope: '客户成功部 / 实施顾问',
    member_count: 12,
    work_days: [1, 2, 3, 4, 5, 6],
    start: '09:30',
    end: '18:30',
    rest: '12:00-13:00',
    flex: true,
    flex_minutes: 60,
    work_hours: 8,
    free_times: 2,
    latest: '22:00',
    shifts: [],
    members: [],
    assignments: [],
    handover_minutes: 30,
    ways: ['GPS 定位', '人脸识别'],
    gps_range: 1000,
    address: '不限办公地点',
    make_up: 5,
    ctime: '2026-05-16 15:00',
    utime: '2026-08-12 10:20',
  },
  {
    id: 'rule-5',
    name: '仓储三班倒',
    mode: 'shift',
    status: 1,
    scope: '供应链中心 / 质量管理部',
    member_count: 5,
    work_days: [],
    start: '21:00',
    end: '07:00',
    rest: '不休息',
    flex: false,
    flex_minutes: 0,
    work_hours: 8,
    free_times: 2,
    latest: '21:00',
    shifts: [
      { name: '夜班', start: '21:00', end: '07:00', cross: true, rest: '01:30-02:30', work_days: [] },
      { name: '白班', start: '07:00', end: '16:00', cross: false, rest: '11:00-12:00', work_days: [] },
      { name: '中班', start: '14:00', end: '23:00', cross: false, rest: '18:00-19:00', work_days: [] },
    ],
    members: ['张伟', '刘洋', '王强', '李娜', '赵磊'],
    assignments: buildTeamRoster(['张伟', '刘洋', '王强', '李娜', '赵磊'], ['夜班', '白班', '中班']),
    handover_minutes: 30,
    ways: ['GPS 定位', '人脸识别'],
    gps_range: 300,
    address: '杭州市萧山区通惠南路 900 号',
    make_up: 3,
    ctime: '2026-04-08 11:20',
    utime: '2026-10-30 18:05',
  },
]

export const USER_GROUPS = [
  { group_id: 'g1', group_name: '总部固定班次', types: 0 },
  { group_id: 'g2', group_name: '研发弹性班次', types: 0 },
]

const WORK_INFO = {
  title: '总部固定班次',
  describe: '09:00 - 18:00',
  work_sec: '32400',
  off_work_sec: '64800',
  prev_work_time: 0,
  update_checkin_time: null,
  work_type: 0,
  finish: false,
}

export const CHECKIN_CURRENT = {
  status: 1,
  record_type: 0,
  group_type: 1,
  group_id: 'g1',
  hash: 'atlas-demo-hash',
  work_info: WORK_INFO,
  ot_info: null,
  time_info: {
    checkin_time: [
      {
        work_sec: '32400',
        off_work_sec: '64800',
        earliest_work_sec: '28800',
        latest_off_work_sec: '68400',
      },
    ],
  },
  exception_location: null,
  allow_schedule_select: false,
  error: null,
  checkin_type: null,
  checkin_time: null,
  location_title: 'Atlas 总部园区',
  need_photo: false,
}

export const CHECKIN_RECORDS = Array.from({ length: 12 }).map((_, i) => ({
  id: `record-${i + 1}`,
  date: fmt(i * 2),
  work_sec: '32400',
  off_work_sec: '64800',
  checkin_time: fmt(i * 2, 9),
  checkout_time: fmt(i * 2, 18),
  checkin_type: i % 4 === 0 ? 1 : 0,
  location_title: 'Atlas 总部园区',
  status_text: i % 4 === 0 ? '迟到' : '正常',
}))

/** 打卡演示状态：提交打卡就地更新，刷新页面后重置 */
const TODAY = new Date()
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

export const CHECKIN_TODAY = {
  date: `${TODAY.getMonth() + 1} 月 ${TODAY.getDate()} 日`,
  weekday: WEEKDAYS[TODAY.getDay()],
  shift: { name: '总部固定班次', start: '09:00', end: '18:00' },
  today: { inTime: null as string | null, outTime: null as string | null },
  month: { days: 8, late: 0, overtime: 6, absent: 0 },
}

function minutesText(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

/** 本月打卡明细（跳过周末，倒序） */
export const CHECKIN_RECORD_LIST = (() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const rows: any[] = []
  for (let d = now.getDate(); d >= 1; d--) {
    const date = new Date(now.getFullYear(), now.getMonth(), d)
    const week = date.getDay()
    if (week === 0 || week === 6)
      continue
    const late = d % 5 === 0
    const inMin = late ? 9 * 60 + 10 + (d % 12) : 8 * 60 + 45 + (d % 22)
    const outMin = 18 * 60 + 5 + ((d * 23) % 95)
    rows.push({
      id: `record-${d}`,
      date: `${month}-${String(d).padStart(2, '0')}`,
      weekday: WEEKDAYS[week],
      inTime: minutesText(inMin),
      outTime: minutesText(outMin),
      hours: ((outMin - inMin) / 60).toFixed(1),
      status: late ? '迟到' : '正常',
    })
  }
  return rows
})()

/** 本月考勤统计 */
export const CHECKIN_STATS = (() => {
  const list = CHECKIN_RECORD_LIST
  const late = list.filter(r => r.status === '迟到').length
  const totalHours = list.reduce((sum, r) => sum + Number(r.hours), 0)
  return {
    month: `${new Date().getMonth() + 1} 月`,
    days: list.length,
    late,
    absent: 0,
    average: list.length ? (totalHours / list.length).toFixed(1) : '0.0',
    overtime: Math.max(0, Math.round(totalHours - list.length * 8)),
    recent: list.slice(0, 7).reverse().map(r => ({
      label: r.date.split('-')[1],
      hours: Number(r.hours),
      status: r.status,
    })),
  }
})()

/** 通讯录 */
export const CONTACT_GROUPS = [
  {
    id: 'tech',
    name: '技术中心',
    members: [
      { id: 'c1', name: '陈一鸣', role: '产品研发组 · 负责人', phone: '138 0013 8000', email: 'chenym@atlas.demo' },
      { id: 'c2', name: '林知远', role: '前端工程师', phone: '138 0013 8001', email: 'linzy@atlas.demo' },
      { id: 'c3', name: '周慕青', role: '后端工程师', phone: '138 0013 8002', email: 'zhoumq@atlas.demo' },
      { id: 'c4', name: '苏亦然', role: '测试工程师', phone: '138 0013 8003', email: 'suyr@atlas.demo' },
    ],
  },
  {
    id: 'fin',
    name: '财务部',
    members: [
      { id: 'c5', name: '沈书言', role: '费用会计', phone: '138 0013 8004', email: 'shensy@atlas.demo' },
      { id: 'c6', name: '赵清和', role: '出纳', phone: '138 0013 8005', email: 'zhaoqh@atlas.demo' },
    ],
  },
  {
    id: 'hr',
    name: '人力资源部',
    members: [
      { id: 'c7', name: '顾南乔', role: '招聘主管', phone: '138 0013 8006', email: 'gunq@atlas.demo' },
      { id: 'c8', name: '许望舒', role: '薪酬专员', phone: '138 0013 8007', email: 'xuws@atlas.demo' },
    ],
  },
  {
    id: 'cs',
    name: '客户成功部',
    members: [
      { id: 'c9', name: '郑听澜', role: '客户经理', phone: '138 0013 8008', email: 'zhengtl@atlas.demo' },
      { id: 'c10', name: '何予安', role: '实施顾问', phone: '138 0013 8009', email: 'heya@atlas.demo' },
    ],
  },
]
