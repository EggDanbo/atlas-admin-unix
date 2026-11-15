import { http } from '@/api/http'

const url = 'atlas/rules'

/** 考勤模式：固定班次 / 自由打卡 / 排班制 */
export type AttendanceMode = 'fixed' | 'free' | 'shift'

export interface ShiftSlot {
  name: string
  start: string
  end: string
  /** 是否跨天（下班时间在次日） */
  cross: boolean
  /** 班次内的休息时段，如 12:00-13:00；「不休息」表示无 */
  rest: string
  /** 固定班次：该班次的工作日（1 = 周一 … 7 = 周日）；排班制按日期排，留空数组 */
  work_days: number[]
}

/** 某人某天的排班：shift 为「休息」表示休息 */
export interface RosterAssignment {
  member: string
  /** YYYY-MM-DD */
  date: string
  shift: string
}

export interface AttendanceRule {
  id: string
  name: string
  mode: AttendanceMode
  /** 1 启用 / 0 停用 */
  status: number
  scope: string
  member_count: number
  /** 固定班次 / 自由打卡：需要打卡的工作日（1 = 周一 … 7 = 周日） */
  work_days: number[]
  /** 固定班次：上下班时间、休息时段、弹性 */
  start: string
  end: string
  rest: string
  flex: boolean
  flex_minutes: number
  /** 自由打卡：每日应出勤工时、每日打卡次数、最晚下班打卡时间 */
  work_hours: number
  free_times: number
  latest: string
  /** 排班制：班次库 + 参与排班的人员 + 按人排班表 + 最小交接间隔（分钟） */
  shifts: ShiftSlot[]
  members: string[]
  assignments: RosterAssignment[]
  handover_minutes: number
  ways: string[]
  gps_range: number
  address: string
  make_up: number
  ctime: string
  utime: string
}

export default {
  /** 规则列表 */
  list: (data?: Recordable) => {
    return http.post<ServiceResultPage<AttendanceRule>>(`${url}/list`, data || {})
  },
  /** 规则详情 */
  get: (id: string) => {
    return http.get<ServiceResult<AttendanceRule>>(`${url}/get`, { id })
  },
  /** 新建规则 */
  create: (data: Recordable) => {
    return http.post<ServiceResult<string>>(`${url}/create`, data)
  },
  /** 修改规则 */
  update: (data: Recordable) => {
    return http.post<ServiceResult<string>>(`${url}/update`, data)
  },
  /** 启用 / 停用 */
  toggle: (id: string) => {
    return http.post<ServiceResult<number>>(`${url}/toggle`, { id })
  },
}
