import { http } from '@/api/http'

/** 部门信息 */
export default {
  /**
   * 获取树状选择
   * @param data 请求数据
   */
  tree: (data?: Recordable) => {
    return http.post<ServiceResult<Recordable[]>>(`organ/room/tree`, data || {})
  },
  /**
   * 获取编辑的详细信息
   * @param id ID
   */
  get: (id: string) => {
    return http.get<ServiceResult<Recordable>>(`organ/room/get`, { id })
  },
  /**
   * 获取分页列表
   * @param data 请求数据
   */
  search: (data: ServiceSearchCondition) => {
    return http.post<ServiceResultPage<Recordable>>(`organ/room/search`, data)
  },
  /**
   * 新增
   * @param data 请求数据
   */
  create: (data: Recordable) => {
    return http.post<ServiceResult<string>>(`organ/room/create`, data)
  },
  /**
   * 修改
   * @param data 请求数据
   */
  update: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/room/update`, data)
  },
  /**
   * 删除
   * @param data 请求数据
   */
  delete: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/room/delete`, data)
  },
  /**
   * 停用/启用
   * @param data 请求数据
   */
  updateStoped: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/room/updatestoped`, data)
  },
  /**
   * 导出Excel
   * @param data 请求数据
   */
  export: (data: ServiceSearchCondition) => {
    return http.post<ServiceResult<string>>(`organ/room/export`, data)
  },
  /**
   * 打印
   * @param data 请求数据
   */
  print: (data: ServiceSearchCondition) => {
    return http.post<ServiceResult<string>>(`organ/room/print`, data)
  },
  /**
   * 批量导入
   * @param data 请求数据
   */
  batchImport: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/room/createbatchimport`, data)
  },
}
