import { http } from '@/api/http'

const url = 'atlas/checkin'

export interface CheckinStatus {
  date: string
  weekday: string
  shift: { name: string, start: string, end: string }
  today: { inTime: string | null, outTime: string | null }
  month: { days: number, late: number, overtime: number, absent: number }
}

export interface CheckinRecord {
  id: string
  date: string
  weekday: string
  inTime: string
  outTime: string
  hours: string
  status: string
}

export interface CheckinStats {
  month: string
  days: number
  late: number
  absent: number
  average: string
  overtime: number
  recent: Array<{ label: string, hours: number, status: string }>
}

export default {
  /** 当前打卡状态：班次、今日记录、本月统计 */
  status: () => {
    return http.get<ServiceResult<CheckinStatus>>(`${url}/status`)
  },
  /** 打卡（in 上班 / out 下班） */
  submit: (type: 'in' | 'out') => {
    return http.post<ServiceResult<CheckinStatus>>(`${url}/submit`, { type })
  },
  /** 本月打卡明细 */
  records: (params: Recordable) => {
    return http.get<ServiceResult<ServicePagedList<CheckinRecord>>>(`${url}/records`, params)
  },
  /** 本月考勤统计 */
  stats: () => {
    return http.get<ServiceResult<CheckinStats>>(`${url}/stats`)
  },
}
