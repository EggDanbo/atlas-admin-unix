import { http } from '@/api/http'

/** 外部机构 */
export default {
  /**
   * 根据列表选择
   * @param data 请求数据
   */
  list: (data: Recordable) => {
    return http.post<ServiceResultPage<Recordable>>(`organ/outer/list`, data)
  },
  /**
   * 获取编辑的详细信息
   * @param id ID
   */
  get: (id: string) => {
    return http.get<ServiceResult<Recordable>>(`organ/outer/get`, { id })
  },
  /**
   * 获取分页列表
   * @param data 请求数据
   */
  search: (data: ServiceSearchCondition) => {
    return http.post<ServiceResultPage<Recordable>>(`organ/outer/search`, data)
  },
  /**
   * 新增
   * @param data 请求数据
   */
  create: (data: Recordable) => {
    return http.post<ServiceResult<string>>(`organ/outer/create`, data)
  },
  /**
   * 修改
   * @param data 请求数据
   */
  update: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/outer/update`, data)
  },
  /**
   * 删除
   * @param data 请求数据
   */
  delete: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/outer/delete`, data)
  },
  /**
   * 合并客户
   * @param data 请求数据
   */
  merge: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/outer/merge`, data)
  },
  /**
   * 修改名称
   * @param data 请求数据
   */
  updateName: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/outer/updatename`, data)
  },
  /**
   * 停用/启用
   * @param data 请求数据
   */
  updateStoped: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/outer/updatestoped`, data)
  },
  /**
   * 导出Excel
   * @param data 请求数据
   */
  export: (data: ServiceSearchCondition) => {
    return http.post<ServiceResult<string>>(`organ/outer/export`, data)
  },
  /**
   * 打印
   * @param data 请求数据
   */
  print: (data: ServiceSearchCondition) => {
    return http.post<ServiceResult<string>>(`organ/outer/print`, data)
  },
  /**
   * 批量导入
   * @param data 请求数据
   */
  batchImport: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/outer/createbatchimport`, data)
  },
}
