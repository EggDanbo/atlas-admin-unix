import type { AttendanceMode, AttendanceRule, RosterAssignment, ShiftSlot } from '@/api/rules.ts'

/** 休息的统一标记，与班次名区分 */
export const REST_SHIFT = '休息'

/** 三种考勤模式：固定班次 / 自由打卡 / 排班制 */
export const MODE_OPTIONS: { value: AttendanceMode, label: string, desc: string }[] = [
  { value: 'fixed', label: '固定班次', desc: '每天固定上下班时间，可开弹性打卡' },
  { value: 'free', label: '自由打卡', desc: '不限定上下班时间，当日打满工时即可' },
  { value: 'shift', label: '排班制', desc: '建好班次后，按人员逐日排班' },
]

/** 工作日选项：1 = 周一 … 7 = 周日 */
export const WEEKDAY_OPTIONS: { value: number, label: string, full: string }[] = [
  { value: 1, label: '一', full: '周一' },
  { value: 2, label: '二', full: '周二' },
  { value: 3, label: '三', full: '周三' },
  { value: 4, label: '四', full: '周四' },
  { value: 5, label: '五', full: '周五' },
  { value: 6, label: '六', full: '周六' },
  { value: 7, label: '日', full: '周日' },
]

/** 默认工作日：周一到周五 */
export const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5]

/** 工作日文案：连续区间压缩为「周一至周五」，零散的天用顿号连接 */
export function workDaysText(days?: number[]) {
  const list = [...new Set((days || []).filter(day => day >= 1 && day <= 7))].sort((a, b) => a - b)
  if (!list.length)
    return '未设置'
  if (list.length === 7)
    return '每天'
  const groups: number[][] = []
  list.forEach((day) => {
    const last = groups[groups.length - 1]
    if (last && day === last[last.length - 1] + 1)
      last.push(day)
    else
      groups.push([day])
  })
  return groups
    .map((group) => {
      const first = WEEKDAY_OPTIONS[group[0] - 1]?.full.replace('周', '') || ''
      const last = WEEKDAY_OPTIONS[group[group.length - 1] - 1]?.full.replace('周', '') || ''
      if (group.length === 1)
        return `周${first}`
      if (group.length === 2)
        return `周${first}、周${last}`
      return `周${first}至周${last}`
    })
    .join('、')
}

export function modeLabel(mode?: string) {
  return MODE_OPTIONS.find(item => item.value === mode)?.label || '固定班次'
}

export function modeDesc(mode?: string) {
  return MODE_OPTIONS.find(item => item.value === mode)?.desc || ''
}

/** 是否跨天：下班时间不晚于上班时间即视为跨天 */
export function isCrossShift(shift: Pick<ShiftSlot, 'start' | 'end'>) {
  return shift.end <= shift.start
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** 班次在一天内的分钟区间，跨天班次结束时间 +24 小时 */
export function shiftRange(shift: Pick<ShiftSlot, 'start' | 'end'>) {
  const start = toMinutes(shift.start)
  let end = toMinutes(shift.end)
  if (end <= start)
    end += 24 * 60
  return [start, end] as const
}

/** 两个班次的时间段是否重叠 */
export function shiftsOverlap(a: Pick<ShiftSlot, 'start' | 'end'>, b: Pick<ShiftSlot, 'start' | 'end'>) {
  const [aStart, aEnd] = shiftRange(a)
  const [bStart, bEnd] = shiftRange(b)
  return aStart < bEnd && bStart < aEnd
}

/** 班次总时长（分钟），跨天按 +24 小时计算 */
export function shiftMinutes(shift: Pick<ShiftSlot, 'start' | 'end'>) {
  const [start, end] = shiftRange(shift)
  return end - start
}

/**
 * 班次内休息分钟数。
 * 休息按当天时间记录；跨天班次里若休息时间早于上班时间，则视为次日。
 */
export function shiftRestMinutes(shift: Pick<ShiftSlot, 'start' | 'end' | 'rest'>) {
  if (!shift.rest || shift.rest === '不休息' || !shift.rest.includes('-'))
    return 0
  const [restStart, restEnd] = shift.rest.split('-')
  const startMin = toMinutes(restStart)
  const endMin = toMinutes(restEnd)
  if (endMin <= startMin)
    return 0
  const [shiftStart, shiftEnd] = shiftRange(shift)
  // 休息早于上班时间时视为跨到次日
  let restFrom = startMin
  if (restFrom < shiftStart)
    restFrom += 24 * 60
  const restTo = restFrom + (endMin - startMin)
  // 休息必须落在班次区间内
  if (restFrom < shiftStart || restTo > shiftEnd)
    return 0
  return endMin - startMin
}

/** 扣除休息后的净工作时长（分钟） */
export function shiftWorkMinutes(shift: Pick<ShiftSlot, 'start' | 'end' | 'rest'>) {
  return Math.max(shiftMinutes(shift) - shiftRestMinutes(shift), 0)
}

/** 跨天按 +24 小时计算，展示净工作时长 */
export function shiftHours(shift: ShiftSlot) {
  const hours = Math.round((shiftWorkMinutes(shift) / 60) * 10) / 10
  return `${hours} 小时`
}

/** 分钟数转 HH:mm（支持跨天回绕） */
export function formatMinutes(total: number) {
  const minutes = ((Math.round(total) % (24 * 60)) + 24 * 60) % (24 * 60)
  return `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`
}

/**
 * 按上下班时间取中间的 1 小时作为休息时段。
 * 时长不足 2 小时则没有休息空间，返回「不休息」。
 */
export function defaultRestRange(start: string, end: string) {
  const [from, to] = shiftRange({ start, end })
  const duration = to - from
  // 只有 1 小时及以下没有休息空间
  if (duration <= 60)
    return '不休息'
  const restStart = Math.round(from + duration / 2 - 30)
  const restEnd = restStart + 60
  // 必须严格落在班次内
  if (restStart <= from || restEnd >= to)
    return '不休息'
  return `${formatMinutes(restStart)}-${formatMinutes(restEnd)}`
}

/** 休息时段是否严格位于班次上下班之间（跨天班次按次日判断） */
export function isRestWithinShift(
  shift: Pick<ShiftSlot, 'start' | 'end'>,
  rest: string,
) {
  if (!rest || rest === '不休息' || !rest.includes('-'))
    return true
  const [restStart, restEnd] = rest.split('-')
  const startMin = toMinutes(restStart)
  const endMin = toMinutes(restEnd)
  if (endMin <= startMin)
    return false
  const [shiftStart, shiftEnd] = shiftRange(shift)
  let from = startMin
  if (from < shiftStart)
    from += 24 * 60
  const to = from + (endMin - startMin)
  return from > shiftStart && to < shiftEnd
}

/** 展示用的休息时段 */
export function shiftRestLabel(shift: Pick<ShiftSlot, 'rest'>) {
  return shift.rest && shift.rest !== '不休息' ? shift.rest : '无休息'
}

/** 固定班次：所有班次的工作日并集（用于列表 / 概览展示） */
export function fixedShiftDays(shifts: ShiftSlot[] | undefined) {
  const days = new Set<number>()
  ;(shifts || []).forEach((slot) => {
    ;(slot.work_days || []).forEach(day => days.add(day))
  })
  return [...days].sort((a, b) => a - b)
}

export interface FixedShiftClash {
  /** 冲突的另一个班次 */
  slot: ShiftSlot
  /** 当前班次落在周几 */
  day: number
  /** 另一个班次落在周几（可能因跨天落在次周） */
  otherDay: number
}

/**
 * 固定班次的跨班次冲突。
 * 把「班次 + 工作日」铺到一周的分钟轴上：跨天班次会占用次日，
 * 因此「周一 22:00 → 次日 06:00」与「周二 05:00 上班」同样判为冲突。
 */
export function findFixedShiftClash(
  shifts: ShiftSlot[],
  target: ShiftSlot,
  gap = 0,
): FixedShiftClash | null {
  const [targetStart, targetEnd] = shiftRange(target)
  const others = shifts.filter(item => item.name !== target.name)

  for (const slot of others) {
    const [start, end] = shiftRange(slot)
    for (const day of target.work_days || []) {
      for (const otherDay of slot.work_days || []) {
        // 一周循环：周日跨天会落到下周一，需要按 ±7 天各比一次
        for (const offset of [-7, 0, 7]) {
          const a = [day * 1440 + targetStart, day * 1440 + targetEnd] as const
          const b = [(otherDay + offset) * 1440 + start, (otherDay + offset) * 1440 + end] as const
          if (intervalsOverlap(a, b, gap))
            return { slot, day, otherDay }
        }
      }
    }
  }
  return null
}

/** 周几的中文名：1 → 周一 */
export function weekdayFull(day: number) {
  return WEEKDAY_OPTIONS[day - 1]?.full || `周${day}`
}

/** 列表卡片的主摘要文案 */
export function ruleMainText(rule: AttendanceRule) {
  if (rule.mode === 'free')
    return '自由上下班'
  if (rule.mode === 'shift')
    return rule.shifts?.length ? `${rule.shifts.length} 个班次` : '尚未添加班次'
  // 固定班次：多个班次时只显示数量，单个班次显示具体时间段
  if (rule.shifts?.length > 1)
    return `${rule.shifts.length} 个班次`
  return `${rule.start} - ${rule.end}`
}

/** 列表卡片右侧的模式标签 */
export function ruleModeHint(rule: AttendanceRule) {
  if (rule.mode === 'free')
    return `日均 ${rule.work_hours} 小时`
  if (rule.mode === 'shift')
    return `${rule.assignments?.length || 0} 人天已排`
  if (rule.flex)
    return `弹性 ${rule.flex_minutes} 分钟`
  return rule.work_days?.length ? workDaysText(rule.work_days) : '固定班次'
}

/* ==================== 日期 ==================== */

export function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`
}

export function dateKeyOf(date: Date) {
  return dateKey(date.getFullYear(), date.getMonth(), date.getDate())
}

export function parseDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y || 1970, (m || 1) - 1, d || 1)
}

export function addDays(base: Date, days: number) {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days)
}

/** 所在周的周一（00:00） */
export function startOfWeek(base: Date) {
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  const offset = (date.getDay() + 6) % 7
  return addDays(date, -offset)
}

/** 从周一开始的 7 天 */
export function weekDates(start: Date) {
  return Array.from({ length: 7 }, (_, index) => dateKeyOf(addDays(start, index)))
}

/** 某一整月的所有日期 */
export function monthDates(year: number, month: number) {
  const days = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: days }, (_, index) => dateKey(year, month, index + 1))
}

export function weekdayLabel(key: string) {
  return ['日', '一', '二', '三', '四', '五', '六'][parseDateKey(key).getDay()]
}

export function dayOfMonth(key: string) {
  return Number(key.slice(8))
}

export function monthLabelOf(key: string) {
  const [y, m] = key.split('-').map(Number)
  return `${y} 年 ${m} 月`
}

/* ==================== 按人排班：冲突与统计 ==================== */

/** 日期字符串转天数序号（UTC，避免时区偏移） */
export function dayNumber(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return Math.floor(Date.UTC(y || 1970, (m || 1) - 1, d || 1) / 86_400_000)
}

/** 把「日期 + 班次」放到绝对时间轴上（分钟），跨天班次自然延伸到次日 */
export function shiftInterval(date: string, shift: Pick<ShiftSlot, 'start' | 'end'>) {
  const base = dayNumber(date) * 1440
  const [start, end] = shiftRange(shift)
  return [base + start, base + end] as const
}

/**
 * 两个区间是否冲突。
 * gap 为最小交接间隔：首尾相接但间隔不足时同样算冲突。
 */
export function intervalsOverlap(a: readonly [number, number], b: readonly [number, number], gap = 0) {
  return a[0] < b[1] + gap && b[0] < a[1] + gap
}

export interface ShiftClash {
  /** 冲突排班所在日期 */
  date: string
  /** 冲突的班次名 */
  shift: string
  /** 该冲突班次是否跨天 */
  cross: boolean
}

/**
 * 找出「某人在某天排 target 班次」的时间冲突。
 * 只看同一个人的排班，跨天班次对次日的占用同样参与判断。
 */
export function findRosterClash(
  assignments: RosterAssignment[],
  member: string,
  date: string,
  target: ShiftSlot,
  shifts: ShiftSlot[],
  handoverMinutes = 0,
): ShiftClash | null {
  const targetInterval = shiftInterval(date, target)
  const rows = assignments.filter(row => row.member === member
    && row.shift
    && row.shift !== REST_SHIFT
    && !(row.date === date && row.shift === target.name))

  const check = (row: RosterAssignment) => {
    const slot = shifts.find(item => item.name === row.shift)
    if (!slot)
      return null
    if (!intervalsOverlap(shiftInterval(row.date, slot), targetInterval, handoverMinutes))
      return null
    return { date: row.date, shift: row.shift, cross: isCrossShift(slot) } as ShiftClash
  }

  // 同一天的冲突优先提示，其次才是前一天跨天占用
  for (const row of rows.filter(item => item.date === date)) {
    const clash = check(row)
    if (clash)
      return clash
  }
  for (const row of rows.filter(item => item.date !== date)) {
    const clash = check(row)
    if (clash)
      return clash
  }
  return null
}

/** 被前一天跨天班次占用的「人员|日期」→ 班次名 */
export function rosterCrossOver(assignments: RosterAssignment[] | undefined, shifts: ShiftSlot[]) {
  const map: Record<string, string> = {}
  ;(assignments || []).forEach((row) => {
    const slot = shifts.find(item => item.name === row.shift)
    if (!slot || !isCrossShift(slot))
      return
    const next = addDays(parseDateKey(row.date), 1)
    map[`${row.member}|${dateKeyOf(next)}`] = row.shift
  })
  return map
}

/** 某个日期范围内的人天统计 */
export function rosterStats(assignments: RosterAssignment[] | undefined, dates: string[]) {
  const scope = new Set(dates)
  const rows = (assignments || []).filter(row => scope.has(row.date) && row.shift)
  return {
    scheduled: rows.filter(row => row.shift !== REST_SHIFT).length,
    rest: rows.filter(row => row.shift === REST_SHIFT).length,
  }
}

/** 单元格里同一天排了多个班次时的展示 */
export function scheduleLabel(names?: string[]) {
  if (!names?.length)
    return ''
  const first = names[0]
  return names.length > 1 ? `${first}+${names.length - 1}` : first
}
