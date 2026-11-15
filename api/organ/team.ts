import { http } from '@/api/http'

/** 单位信息 */
export default {
  /**
   * 获取树状选择
   * @param data 请求数据
   */
  tree: (data?: Recordable) => {
    return http.post<ServiceResult<Recordable[]>>(`organ/team/tree`, data || {})
  },
  /**
   * 获取编辑的详细信息
   * @param id ID
   */
  get: (id: string) => {
    return http.get<ServiceResult<Recordable>>(`organ/team/get`, { id })
  },
  /**
   * 获取分页列表
   * @param data 请求数据
   */
  search: (data: ServiceSearchCondition) => {
    return http.post<ServiceResultPage<Recordable>>(`organ/team/search`, data)
  },
  /**
   * 新增
   * @param data 请求数据
   */
  create: (data: Recordable) => {
    return http.post<ServiceResult<string>>(`organ/team/create`, data)
  },
  /**
   * 修改
   * @param data 请求数据
   */
  update: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/team/update`, data)
  },
  /**
   * 删除
   * @param data 请求数据
   */
  delete: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/team/delete`, data)
  },
  /**
   * 停用/启用
   * @param data 请求数据
   */
  updateStoped: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/team/updatestoped`, data)
  },
  /**
   * 导出Excel
   * @param data 请求数据
   */
  export: (data: ServiceSearchCondition) => {
    return http.post<ServiceResult<string>>(`organ/team/export`, data)
  },
  /**
   * 打印
   * @param data 请求数据
   */
  print: (data: ServiceSearchCondition) => {
    return http.post<ServiceResult<string>>(`organ/team/print`, data)
  },
  /**
   * 批量导入
   * @param data 请求数据
   */
  batchImport: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/team/createbatchimport`, data)
  },
}
