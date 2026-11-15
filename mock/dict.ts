import type { MockField, MockModule } from './schema.generated.ts'
import { intBetween, pick } from './random.ts'

/** 演示数据的时间基准（2026-11-01），保证不同环境看到同一批数据 */
const ANCHOR = Date.UTC(2026, 10, 1, 9, 0, 0)
const DAY = 24 * 60 * 60 * 1000

const NAMES = [
  '陈一鸣',
  '林知远',
  '周慕青',
  '苏亦然',
  '沈书言',
  '赵清和',
  '顾南乔',
  '许望舒',
  '唐屿',
  '何晏',
  '郑融',
  '韩沐',
  '秦朗',
  '罗晴',
  '吴悠',
  '蒋诚',
  '冯可',
  '邓嘉',
  '谢宁',
  '白露',
]

const DEPTS = [
  '技术中心',
  '产品设计部',
  '财务部',
  '人力资源部',
  '市场部',
  '客户成功部',
  '运营管理部',
  '供应链部',
]

const BRANCHES = ['前端组', '后端组', '测试组', '核算组', '资金组', '招聘组', '品牌组', '交付组']

const CUSTOMERS = [
  '星澜科技有限公司',
  '云栖智造有限公司',
  '恒泰实业集团',
  '明远物流有限公司',
  '青禾文旅发展有限公司',
  '启元教育科技',
  '和光医疗器械',
  '海川新能源',
]

const PROJECTS = [
  '智慧园区一体化平台',
  '城市服务数字中台',
  '企业协同办公升级',
  '资产全生命周期管理',
  '客户服务工单系统',
  '数据治理与报表平台',
  '供应链协同门户',
  '移动审批体验优化',
]

/** 资产名称 / 品牌 / 型号 / 分类保持一致，避免「办公椅」出现在「网络设备」下 */
const ASSET_TUPLES = [
  { name: 'ThinkPad X1 Carbon 笔记本', brand: '联想', model: 'X1 Carbon', category: '电子设备', unit: '台' },
  { name: 'UltraSharp 27 显示器', brand: '戴尔', model: 'U2723QE', category: '电子设备', unit: '台' },
  { name: 'MateBook 14 笔记本', brand: '华为', model: 'MateBook 14', category: '电子设备', unit: '台' },
  { name: 'LaserJet 激光打印机', brand: '惠普', model: 'M405dn', category: '办公设备', unit: '台' },
  { name: '65 寸会议平板', brand: '明基', model: '65BDL', category: '会议设备', unit: '台' },
  { name: '机架式服务器', brand: '联想', model: 'SR650', category: '网络设备', unit: '台' },
  { name: '千兆网络交换机', brand: '华为', model: 'S5735', category: '网络设备', unit: '台' },
  { name: '人体工学办公椅', brand: '联创', model: 'EC-200', category: '办公家具', unit: '把' },
  { name: '档案密集柜', brand: '嘉合', model: 'DA-12', category: '办公家具', unit: '组' },
  { name: '便携投影仪', brand: '飞利浦', model: 'PPX-620', category: '会议设备', unit: '台' },
]

function assetOf(index: number) {
  return ASSET_TUPLES[index % ASSET_TUPLES.length]
}

const PAPERS = [
  '年度采购合同归档',
  '供应商资质档案',
  '项目验收报告',
  '员工入职资料',
  '财务凭证册',
  '设备维保记录',
  '客户服务协议',
]

const SUPPLIERS = ['联创办公设备', '宏图数码', '恒信科技', '优派供应链', '嘉合商贸']
const BRANDS = ['联想', '戴尔', '华为', '惠普', '飞利浦', '明基']
const MODELS = ['X1 Carbon', 'U2723QE', 'MateBook 14', 'M405dn', '65BDL', 'MS-820']
const UNITS = ['台', '套', '个', '件', '批']
const CATEGORIES = ['电子设备', '办公家具', '网络设备', '办公耗材', '会议设备']
const BANKS = ['中国银行', '招商银行', '工商银行', '建设银行']
const ADDRESSES = ['总部园区 A 座 3 层', '研发中心 5 号楼 2 层', '华东分部 12 层', '华南分部 8 层', '档案室 B1']

const EXPENSE_TITLES = ['差旅费报销', '客户接待费', '办公用品采购', '培训费用报销', '交通费报销', '团建活动费用']
const APPLY_TITLES = ['请假申请', '加班申请', '外出拜访申请', '补卡申请', '调班申请']
const DAILY_TITLES = ['季度绩效奖励', '项目交付表彰', '岗位晋级申请', '考勤异常扣款', '年度优秀员工']
const LEAVE_TITLES = ['个人原因辞职', '合同到期不再续签', '协商解除劳动合同', '试用期不符合录用条件']

const REMARKS = [
  '按计划提交，相关附件已上传。',
  '费用明细已核对，票据齐全。',
  '经部门负责人确认后提交。',
  '用于本月项目交付，请审批。',
  '流程按制度执行，备注供参考。',
]

const DIGESTS = [
  '客户现场支持产生的交通与住宿费用。',
  '季度团队建设活动支出，参与 12 人。',
  '办公区设备更新，替换超期服役终端。',
  '外部培训课程报名费，含教材。',
  '项目验收阶段的差旅与招待支出。',
]

/** 单据编号前缀 */
const CODE_PREFIX: Record<string, string> = {
  'asset/info': 'ZC',
  'asset/order': 'CG',
  'asset/apply': 'SL',
  'asset/allot': 'DB',
  'asset/lease': 'JY',
  'asset/batch': 'YS',
  'asset/repair': 'WX',
  'asset/disuse': 'CZ',
  'pense/apply': 'BX',
  'pense/order': 'CG',
  'pense/contract': 'HT',
  'pense/borrow': 'BJ',
  'pense/payer': 'SF',
  'pense/ansure': 'BZ',
  'pense/serve': 'ZD',
  'pense/travel': 'CC',
  'pense/query': 'BX',
  'paper/borrow': 'DA',
  'trade/custom': 'KH',
  'trade/project': 'XM',
  'staff/resume': 'RY',
  'staff/apply/query': 'KQ',
  'staff/apply/outside': 'WC',
  'staff/apply/overtime': 'JB',
  'staff/apply/reissue': 'BK',
  'staff/apply/translate': 'TB',
  'staff/apply/vacation': 'QJ',
  'staff/alter/adjust': 'DG',
  'staff/alter/allot': 'DD',
  'staff/alter/entry': 'RZ',
  'staff/leave/retire': 'LZ',
  'staff/leave/remove': 'CT',
  'staff/leave/refuse': 'ZL',
  'staff/daily/because': 'JC',
  'staff/daily/promote': 'JJ',
}

const DATE_KEYS = new Set([
  'date',
  'start',
  'expire',
  'indate',
  'insure',
  'handle',
  'enroll',
  'issues',
  'disuse',
  'predict',
  'birthday',
  'checkin_date',
  'checkin_back',
  'checkin_time',
])

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0')
}

/** 单据编号：前缀 + 年月 + 流水 */
function codeOf(base: string, index: number): string {
  const prefix = CODE_PREFIX[base] || 'AT'
  const no = 1000 + index * 7
  return `${prefix}-2026-${pad(no, 4)}`
}

/** 按模块生成「名称」类字段 */
function nameOf(module: MockModule, rng: () => number, index = 0): string {
  const page = module.page
  if (page === 'asset/info')
    return assetOf(index).name
  if (page === 'trade/custom')
    return pick(CUSTOMERS, rng)
  if (page === 'trade/project')
    return pick(PROJECTS, rng)
  if (page === 'staff/resume')
    return pick(NAMES, rng)
  return pick(PROJECTS, rng)
}

function titleOf(module: MockModule, rng: () => number, index = 0): string {
  const page = module.page
  if (page.startsWith('pense/'))
    return pick(EXPENSE_TITLES, rng)
  if (page.startsWith('staff/apply'))
    return pick(APPLY_TITLES, rng)
  if (page.startsWith('staff/daily'))
    return pick(DAILY_TITLES, rng)
  if (page.startsWith('staff/leave'))
    return pick(LEAVE_TITLES, rng)
  if (page === 'paper/borrow')
    return pick(PAPERS, rng)
  if (page === 'trade/project')
    return pick(PROJECTS, rng)
  if (page === 'asset/info')
    return assetOf(index).name
  return `${module.title}事项`
}

function dateOf(index: number, rng: () => number): number {
  return ANCHOR - index * 6 * DAY - Math.floor(rng() * 4) * DAY
}

/**
 * 生成单个字段的值
 *
 * 优先按字段名判断语义，其次按中文标题兜底，
 * 保证「金额」不会出现中文、「日期」不会出现随机字符串。
 */
export function fieldValue(module: MockModule, field: MockField, index: number, rng: () => number): any {
  const { key, label } = field

  if (key === 'id')
    return `${module.base}-${index + 1}`

  if (key === 'code' || (key === 'no' && !label.includes('统一代码')))
    return codeOf(module.base, index + 1)

  if (key === 'no' && label.includes('统一代码'))
    return `9133${pad(index + 1, 2)}MA2*******`

  if (DATE_KEYS.has(key))
    return dateOf(index, rng)

  if (key === 'amount' || key === 'ensure' || key === 'realize' || key === 'residue')
    return Math.round((intBetween(rng, 300, 68000) + rng()) * 100) / 100

  if (key === 'times') {
    if (label.includes('合同天数'))
      return intBetween(rng, 90, 730)
    return Math.round((intBetween(rng, 2, 16) + rng()) * 10) / 10
  }

  if (key === 'pcs' || key === 'age' || key === 'durable')
    return intBetween(rng, key === 'age' ? 23 : 1, key === 'age' ? 55 : 60)

  if (key === 'months')
    return '1,2,7,8'

  if (key === 'team_name' || key === 'team_in_name' || key === 'team_id')
    return pick(DEPTS, rng)

  if (key === 'lend_name' || key === 'outer_name')
    return pick(DEPTS, rng)

  if (key === 'branch_name')
    return pick(BRANCHES, rng)

  if (key === 'lead_name' && /部门|单位|科室|机构/.test(label))
    return pick(DEPTS, rng)

  if (['user_name', 'lead_name', 'check_name', 'swap_name', 'contact', 'payee_name', 'name'].includes(key)) {
    if (key === 'name')
      return nameOf(module, rng, index)
    return pick(NAMES, rng)
  }

  if (key === 'title')
    return titleOf(module, rng, index)

  if (key === 'digest' || key === 'content' || key === 'reason')
    return pick(DIGESTS, rng)

  if (key === 'remark')
    return pick(REMARKS, rng)

  if (key === 'address')
    return pick(ADDRESSES, rng)

  if (key === 'payee_open' || key === 'deposit')
    return pick(BANKS, rng)

  if (key === 'payee_bank') {
    return label.includes('账号') || label.includes('账户')
      ? `6222 **** **** ${pad(intBetween(rng, 1000, 9999), 4)}`
      : pick(BANKS, rng)
  }

  if (key === 'account')
    return `6222 **** **** ${pad(intBetween(rng, 1000, 9999), 4)}`

  if (key === 'payee_link')
    return `1028${pad(intBetween(rng, 100000, 999999), 6)}`

  if (key === 'mobile' || key === 'hotline')
    return `1380013${pad(8000 + (index % 20))}`

  if (key === 'email')
    return `demo${index + 1}@example.com`

  if (key === 'card')
    return `310***********${pad(1000 + index, 4)}`

  if (key === 'brand')
    return module.page === 'asset/info' ? assetOf(index).brand : pick(BRANDS, rng)

  if (key === 'model')
    return module.page === 'asset/info' ? assetOf(index).model : pick(MODELS, rng)

  if (key === 'unit')
    return module.page === 'asset/info' ? assetOf(index).unit : pick(UNITS, rng)

  if (key === 'supplier')
    return pick(SUPPLIERS, rng)

  if (key === 'serial')
    return `SN2026${pad(index + 1, 6)}`

  if (key === 'article_name')
    return module.page === 'asset/info' ? assetOf(index).category : pick(CATEGORIES, rng)

  if (key === 'methods')
    return '平均年限法'

  if (key === 'nature')
    return pick(['企业客户', '个人客户'], rng)

  if (key === 'pattern')
    return pick(['固定总价', '人月计费', '按量结算'], rng)

  if (key === 'paper_name')
    return pick(PAPERS, rng)

  if (key === 'group_name')
    return pick(['总部固定班次', '研发弹性班次', '客服轮班制'], rng)

  if (key === 'group_type')
    return pick(['固定班次', '弹性班次', '排班制'], rng)

  if (key === 'status' || key === 'states')
    return String(index % 4)

  if (key === 'gender')
    return String((index % 2) + 1)

  if (key === 'types' || key === 'source' || key === 'payment')
    return String(index % 2)

  if (key === 'black' || key === 'require')
    return index % 3 === 0 ? 1 : 0

  if (key === 'stoped')
    return String(index % 11 === 0 ? 1 : 0)

  if (key === 'explain' || key === 'explan')
    return pick(['正常使用中的损耗', '需要更换配件', '现场调试后恢复'], rng)

  if (key === 'position')
    return pick(['工程师', '高级工程师', '主管', '经理', '专员'], rng)

  if (key === 'ranks')
    return pick(['P4', 'P5', 'P6', 'M1', 'M2'], rng)

  if (key === 'scale')
    return pick(['A', 'B', 'B+', 'C'], rng)

  if (key === 'salary' || key === 'buy' || key === 'price' || key === 'quotas')
    return Math.round((intBetween(rng, 200, 20000) + rng()) * 100) / 100

  if (key === 'guests')
    return intBetween(rng, 2, 12)

  if (key === 'day')
    return 1

  if (key === 'over_time')
    return intBetween(rng, 2, 6)

  if (key === 'leave_time_fmt' || key === 'day_type_fmt')
    return '工作日'

  if (key === 'is_work_day')
    return 1

  if (key === 'depart' || key === 'bourn')
    return pick(['杭州', '南京', '成都', '武汉'], rng)

  if (key === 'content_name')
    return pick(PROJECTS, rng)

  if (key === 'allot')
    return pick(['按部门分摊', '按项目分摊', '不分摊'], rng)

  if (key === 'invoice')
    return `INV-2026-${pad(index + 1, 5)}`

  if (key === 'expense_name')
    return pick(['交通费', '住宿费', '餐饮费', '办公用品', '培训费'], rng)

  if (key === 'files_fp')
    return ''

  // 兜底：按中文标题猜一类文本，避免出现数字或空值
  if (label.includes('日期') || label.includes('时间'))
    return dateOf(index, rng)
  if (label.includes('金额') || label.includes('费用') || label.includes('工资'))
    return Math.round((intBetween(rng, 500, 50000) + rng()) * 100) / 100
  if (label.includes('单位') || label.includes('部门'))
    return pick(DEPTS, rng)
  if (label.includes('人') || label.includes('姓名'))
    return pick(NAMES, rng)
  if (label.includes('电话') || label.includes('手机'))
    return `1380013${pad(8000 + (index % 20))}`

  return '—'
}
