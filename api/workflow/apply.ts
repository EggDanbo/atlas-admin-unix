import { http } from '@/api/http'

const url = 'workflow/apply'

export default {
  /**
   * 获取分页列表
   * @param data 请求数据
   */
  search: (data?: Recordable) => {
    return http.post<ServiceResultPage<Recordable>>(`${url}/search`, data || {})
  },
  /**
   * 单据详情（含审批流）
   * @param id 单据 id
   */
  get: (id: string) => {
    return http.get<ServiceResult<Recordable>>(`${url}/get`, { id })
  },
  /**
   * 撤回申请（仅待审批 / 审批中可撤回）
   * @param id 单据 id
   */
  revoke: (id: string) => {
    return http.post<ServiceResult<string>>(`${url}/revoke`, { id })
  },
  /**
   * 导出Excel
   * @param data 请求数据
   */
  export: (data: ServiceSearchCondition) => {
    return http.post<ServiceResult<string>>(`${url}/export`, data)
  },
  /**
   * 打印
   * @param data 请求数据
   */
  print: (data: ServiceSearchCondition) => {
    return http.post<ServiceResult<string>>(`${url}/print`, data)
  },
}
