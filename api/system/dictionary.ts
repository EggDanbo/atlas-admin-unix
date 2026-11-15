import { http } from '@/api/http'

/** 字典管理 */
export default {
  /**
   * 字典信息
   * @param id ID
   */
  get: (id: string) => {
    return http.get<ServiceResult<Recordable>>(`dictionary/get`, { id })
  },
  /**
   * 字典列表
   * @param name 名称
   */
  getList: (name: string) => {
    return http.get<ServiceResult<Recordable[]>>(`dictionary/getlist`, { name })
  },
  /**
   * 字典根节点新增
   * @param data 请求数据
   */
  createRoot: (data: Recordable) => {
    return http.post<ServiceResult<string>>(`dictionary/createroot`, data)
  },
  /**
   * 字典根节点修改
   * @param data 请求数据
   */
  updateRoot: (data: Recordable) => {
    return http.post<ServiceResponse>(`dictionary/updateroot`, data)
  },
  /**
   * 字典根节点删除
   * @param data 请求数据
   */
  deleteRoot: (data: Recordable) => {
    return http.post<ServiceResponse>(`dictionary/deleteroot`, data)
  },
  /**
   * 字典导出脚本
   */
  exportScript: () => {
    return http.get<ServiceResult<string>>(`dictionary/exportscript`)
  },
  /**
   * 字典新增
   * @param data 请求数据
   */
  create: (data: Recordable) => {
    return http.post<ServiceResult<string>>(`dictionary/create`, data)
  },
  /**
   * 字典修改
   * @param data 请求数据
   */
  update: (data: Recordable) => {
    return http.post<ServiceResponse>(`dictionary/update`, data)
  },
  /**
   * 字典删除
   * @param data 请求数据
   */
  delete: (data: Recordable) => {
    return http.post<ServiceResponse>(`dictionary/delete`, data)
  },
  /**
   * 字典完整树
   */
  getAllTree: () => {
    return http.get<ServiceResult<Recordable[]>>(`dictionary/getalltree`)
  },
  /**
   * 字典节点列表
   * @param parentId 父级ID
   * @param name 名称(可选)
   */
  getNodeList: (parentId: string, name?: string) => {
    return http.get<ServiceResult<Recordable[]>>(`dictionary/getnodelist`, { parent_id: parentId, name })
  },
  /**
   * 查询节点
   * @param data 请求数据
   */
  search: (data: Recordable) => {
    return http.post<ServiceResult<Recordable[]>>(`dictionary/search`, data)
  },
  /**
   * 字典列表排序
   * @param data 请求数据
   */
  updateSort: (data: Recordable[]) => {
    return http.post<ServiceResponse>(`dictionary/updatesort`, data)
  },
}
