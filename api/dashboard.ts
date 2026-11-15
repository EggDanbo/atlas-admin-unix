import { http } from '@/api/http'

const url = 'atlas/dashboard'

export interface DashboardKpi {
  label: string
  value: string
  unit: string
}

export interface DashboardTrendItem {
  label: string
  value: number
  done: number
}

export interface DashboardDept {
  name: string
  total: number
  pending: number
}

export interface DashboardType {
  name: string
  value: number
  ratio: number
}

export interface DashboardSummary {
  kpis: DashboardKpi[]
  pending: number
  rate: number
  trend: DashboardTrendItem[]
  depts: DashboardDept[]
  types: DashboardType[]
}

export default {
  /** 管理看板汇总：指标、走势、部门分布、单据类型 */
  summary: () => {
    return http.get<ServiceResult<DashboardSummary>>(`${url}/summary`)
  },
}
