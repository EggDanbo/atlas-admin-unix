import { http } from '@/api/http'

/** 人员设置 */
export default {
  /**
   * 获取人员列表
   * @param data 请求数据
   */
  list: (data: Recordable) => {
    return http.post<ServiceResultPage<Recordable>>(`organ/user/list`, data)
  },
  /**
   * 获取编辑的详细信息
   * @param userId 用户ID
   */
  get: (userId: string) => {
    return http.get<ServiceResult<Recordable>>(`organ/user/get`, { user_id: userId })
  },
  /**
   * 获取分页列表
   * @param data 请求数据
   */
  search: (data: ServiceSearchCondition) => {
    return http.post<ServiceResultPage<Recordable>>(`organ/user/search`, data)
  },
  /**
   * 新增
   * @param data 请求数据
   */
  create: (data: Recordable) => {
    return http.post<ServiceResult<string>>(`organ/user/create`, data)
  },
  /**
   * 修改
   * @param data 请求数据
   */
  update: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/user/update`, data)
  },
  /**
   * 删除
   * @param data 请求数据
   */
  delete: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/user/delete`, data)
  },
  /**
   * 更新缩写码
   */
  updateAbbr: () => {
    return http.post<ServiceResponse>(`organ/user/updateabbr`, {})
  },
  /**
   * 人员排序
   * @param data 请求数据
   */
  updateSort: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/user/updatesort`, data)
  },
  /**
   * 更新人员停用状态
   * @param data 请求数据
   */
  updateStoped: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/user/updatestoped`, data)
  },
  /**
   * 导出Excel
   * @param data 请求数据
   */
  export: (data: ServiceSearchCondition) => {
    return http.post<ServiceResult<string>>(`organ/user/export`, data)
  },
  /**
   * 打印
   * @param data 请求数据
   */
  print: (data: ServiceSearchCondition) => {
    return http.post<ServiceResult<string>>(`organ/user/print`, data)
  },
  /**
   * 批量导入
   * @param data 请求数据
   */
  batchImport: (data: Recordable) => {
    return http.post<ServiceResponse>(`organ/user/createbatchimport`, data)
  },
  /**
   * 照片批量导入
   * @param data 请求数据
   */
  batchImportImage: (data: Recordable) => {
    return http.post<ServiceResult<string>>(`organ/user/imagebatchimport`, data)
  },
}
