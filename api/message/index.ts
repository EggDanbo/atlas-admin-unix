import { http } from '@/api/http'

const url = 'message/my'

/** 数据格式 */
export default {
  /**
   * 消息通知
   * @param data
   */
  massSend: (data: Recordable) => {
    return http.post<ServiceResponse>(`${url}/masssend`, data)
  },
  /**
   * 标记消息已读
   * @param id
   */
  read: (id: string) => {
    return http.post<ServiceResponse>(`${url}/read`, { value: id })
  },
  /**
   * 标记消息全部已读
   * @param kind 类型
   * @param types 分类
   */
  readAll: (kind: string, types?: number) => {
    return http.post<ServiceResponse>(`${url}/readAll`, { kind, types })
  },
  /**
   * 获取未读消息
   * @param kind 类型
   * @param types 分类
   */
  getUnRead: (kind: string, types?: number) => {
    return http.get<ServiceResponse>(`${url}/getUnRead`, { kind, types, limit: 10 })
  },
  /**
   * 获取用户自定义网格设置
   */
  search: (data: ServicePagination & { [key: string]: any }) => {
    return http.get<ServiceResultPage<Recordable>>(`${url}/search`, { ...data })
  },
}
