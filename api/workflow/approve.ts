import { http } from '@/api/http'

const url = 'workflow/approve'

export default {
  /**
   * 获取分页列表
   * @param data 请求数据
   */
  search: (data?: Recordable) => {
    return http.post<ServiceResultPage<Recordable>>(`${url}/search`, data || {})
  },
  /**
   * 审批/退回
   * @param data 请求数据
   */
  process: (data: Recordable) => {
    return http.post<ServiceResult<string>>(`${url}/process`, data)
  },
  /**
   * 一键审批
   * @param data 请求数据
   */
  confirm: (data?: Recordable) => {
    return http.post<ServiceResponse>(`${url}/confirm`, data || {})
  },
  /**
   * 取消审批
   * @param data 请求数据
   */
  cancel: (data: Recordable) => {
    return http.post<ServiceResponse>(`${url}/cancel`, data)
  },
  /**
   * 撤回
   * @param data 请求数据
   */
  revoke: (data?: Recordable) => {
    return http.post<ServiceResponse>(`${url}/revoke`, data || {})
  },
  /**
   * 作废
   * @param data 请求数据
   */
  invalid: (data?: Recordable) => {
    return http.post<ServiceResponse>(`${url}/invalid`, data || {})
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
